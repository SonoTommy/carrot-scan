import fs from 'node:fs/promises';
import path from 'node:path';
import { globby } from 'globby';
import escomplex from 'typhonjs-escomplex';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
//import xray from 'js-x-ray';   // CJS default export exposes .analyze()
import { AstAnalyser } from '@nodesecure/js-x-ray';
import { createRequire } from 'node:module';
const requireCJS = createRequire(import.meta.url);
const eslintMain = requireCJS.resolve('eslint');
const eslintBin = path.resolve(path.dirname(eslintMain), '../bin/eslint.js');

//TEST
const xray = new AstAnalyser();

/**
 * Runs the ESLint CLI with recommended rules and returns total error count.
 * Disables project configs via --no-eslintrc.
 * @param {string[]} files
 */
async function runESLint(files) {
  if (!files.length) return 0;
  try {
    const args = [
      '--no-eslintrc',
      '--config', 'eslint:recommended',
      '--format', 'json',
      ...files,
    ];
    const { stdout } = await execFile(eslintBin, args);
    const results = JSON.parse(stdout);
    return results.reduce((sum, r) => sum + r.errorCount, 0);
  } catch {
    return 0;
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   2. Run `npm audit --json` and tally vulnerabilities
   ────────────────────────────────────────────────────────────────────────── */
const exec = promisify(execFile);

async function runNpmAudit(cwd) {
  try {
    const { stdout } = await exec('npm', ['audit', '--json'], { cwd });
    const audit = JSON.parse(stdout);
    const vulns = audit.vulnerabilities || audit;        // Node ≥20 vs older
    let critical = 0, high = 0, moderate = 0;
    for (const v of Object.values(vulns)) {
      critical += v.critical  || 0;
      high     += v.high      || 0;
      moderate += v.moderate  || 0;
    }
    return { critical, high, moderate };
  } catch {
    return null;         // offline / no package.json? … just skip
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   3. Constants
   ────────────────────────────────────────────────────────────────────────── */
const CODE_EXT = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx']);

// --- Heuristic fallback for all files (counts every match) ----------
const BAD_PATTERNS = [
  /eval\s*\(/gi,                            // eval() calls
  /exec\s*(?:Sync)?\s*\(/gi,                // exec()/execSync()
  /system\s*\(/gi,                          // system()
  /include\s*\(/gi,                         // PHP include()
  /require\s*\(/gi,                         // PHP require()
  /mysqli_query\s*\(/gi,                    // PHP SQL ops
  /\$_(GET|POST|REQUEST)\b/gi,              // raw superglobals
  /\bSELECT\s+.*\bFROM\b.*\bWHERE\b/gi,     // SQL‐injection
  /base64_decode\s*\(/gi,                   // PHP obfuscation
  /new Function\s*\(/gi,                    // JS dynamic code
  /shell_exec\s*\(/gi,                      // PHP shell_exec()
  /popen\s*\(/gi,                           // PHP popen()
  /passthru\s*\(/gi,                        // PHP passthru()
  /proc_open\s*\(/gi,                       // PHP proc_open()
  /pcntl_exec\s*\(/gi,                      // PHP pcntl_exec()
  /preg_replace\s*\(.*\/e/gi,               // preg_replace /e modifier
];
function heuristicBadness(text) {
  return BAD_PATTERNS.reduce((count, re) => {
    const matches = text.match(re);
    return count + (matches ? matches.length : 0);
  }, 0);
}

/* ────────────────────────────────────────────────────────────────────────────
   4. Public API
   ────────────────────────────────────────────────────────────────────────── */
/**
 * Scan a file or directory and return {score, rating, messages, …}
 * @param {string} target
 * @param {{mode:'fast'|'default'|'complete'}} opts
 */
export async function scan(target, { mode = 'default' } = {}) {
  const stats = await fs.stat(target);

  // Gather all non-ignored files
  const allFiles = stats.isDirectory()
    ? await globby(['**/*'], {
        cwd: target,
        gitignore: true,
        absolute: true,
        onlyFiles: true,
        dot: true,           // include hidden/dotfiles
      })
    : [path.resolve(target)];

  // Separate JS/TS files from others
  const jsFiles = allFiles.filter(f => CODE_EXT.has(path.extname(f)));
  const otherFiles = allFiles.filter(f => !CODE_EXT.has(path.extname(f)));

  if (allFiles.length === 0) {
    return {
      target,
      mode,
      score: 100,
      rating: 'good',
      messages: ['No analyzable files found.'],
      exitCode: 0,
    };
  }

  /* 4.2 ESLint */
  // 4.2 ESLint (via CLI)
  const lintErrors = await runESLint(jsFiles);

  /* 4.3 Cyclomatic complexity (skip in fast) */
  let complexityPenalty = 0;
  if (mode !== 'fast') {
    for (const file of jsFiles) {
      const src = await fs.readFile(file, 'utf8');
      const { aggregate: { cyclomatic: cc } } = escomplex.analyzeModule(src);
      if (cc > 10) complexityPenalty += cc - 10;
    }
  }

  /* 4.4 js-x-ray scan for injection / backdoor patterns (skip in fast) */
  let xrayPenalty = 0;
  let xrayCount = 0;
  if (mode !== 'fast') {
    for (const file of jsFiles) {
      // Analyse file on disk via NodeSecure AST analyser
      const { warnings } = await xray.analyseFile(file);
      if (warnings && warnings.length) {
        xrayCount += warnings.length;
      }
    }
    xrayPenalty = xrayCount * 10;       // −10 points per finding
  }

  /* 4.5 Heuristic scan for other files */
  let heuristicPenalty = 0;
  let heuristicCount = 0;
  for (const file of otherFiles) {
    const text = await fs.readFile(file, 'utf8');
    const hits = heuristicBadness(text);
    if (hits) heuristicCount += hits;
  }
  heuristicPenalty = heuristicCount * 3;  // −3 points per pattern

  /* 4.6 Security vulnerabilities (npm audit) – skip in fast */
  let vulnPenalty = 0;
  if (mode !== 'fast') {
    const pkgDir = stats.isDirectory() ? target : path.dirname(target);
    const vuln = await runNpmAudit(pkgDir);
    if (vuln) vulnPenalty = vuln.critical * 5 + vuln.high * 5 + vuln.moderate * 2;
  }

  /* 4.7 Scoring */
  let score = 100;
  score -= lintErrors * 2;
  score -= complexityPenalty;
  score -= xrayPenalty;
  score -= heuristicPenalty;
  score -= vulnPenalty;
  score = Math.max(0, score);

  const rating = score >= 80 ? 'good'
               : score >= 50 ? 'not good'
               : 'bad';

  const messages = [
    `${lintErrors} ESLint error(s)`,
    ...(mode !== 'fast' ? [`${complexityPenalty} complexity penalty`] : []),
    ...(mode !== 'fast' && xrayCount ? [`${xrayCount} potential injection/backdoor pattern(s)`] : []),
    ...(heuristicCount ? [`${heuristicCount} heuristic pattern(s)`] : []),
    ...(mode !== 'fast' && vulnPenalty ? [`${vulnPenalty} security penalty`] : []),
  ];

  return {
    target,
    mode,
    score,
    rating,
    messages,
    exitCode: rating === 'good' ? 0 : rating === 'not good' ? 1 : 2,
  };
}