import fs from 'node:fs/promises';
import path from 'node:path';
import { globby } from 'globby';
import { ESLint } from 'eslint';
import escomplex from 'typhonjs-escomplex';

/**
 * Pre‑configured ESLint instance.
 * – disable searching for project configs
 * – use a tiny default rule‑set (eslint:recommended)
 */
const eslint = new ESLint({
  overrideConfigFile: true,   // do not search for eslint.config.js
  overrideConfig: {
    root: true,
    extends: ['eslint:recommended'],
  },
});

/** File extensions we can analyse */
const CODE_EXT = new Set([
  '.js', '.mjs', '.cjs',
  '.ts', '.tsx',
  '.jsx',
]);

/**
 * Scan a file or directory and return a score / verdict.
 * @param {string} target Path to the file or folder to scan
 * @param {{mode:'fast'|'complete'|'default'}} opts
 */
export async function scan(target, { mode = 'default' } = {}) {
  const stats = await fs.stat(target);

  // 1. Build the file list
  const files = stats.isDirectory()
    ? await globby(['**/*.{js,mjs,cjs,ts,tsx,jsx}'], {
        cwd: target,
        gitignore: true,
        absolute: true,
      })
    : CODE_EXT.has(path.extname(target))
        ? [path.resolve(target)]
        : [];

  // Short‑circuit if there is nothing to analyse
  if (files.length === 0) {
    return {
      target,
      mode,
      score: 100,
      rating: 'good',
      messages: ['No analyzable JavaScript/TypeScript files.'],
      exitCode: 0,
    };
  }

  // ---------- 2. ESLint ----------
  const lintResults = await eslint.lintFiles(files);
  const lintErrors = lintResults.reduce((sum, r) => sum + r.errorCount, 0);

  // ---------- 3. Cyclomatic complexity ----------
  let complexityPenalty = 0;
  if (mode !== 'fast') { // skip in fast mode
    for (const file of files) {
      const src = await fs.readFile(file, 'utf8');
      const report = escomplex.analyzeModule(src);
      const cc = report.aggregate.cyclomatic;
      if (cc > 10) complexityPenalty += cc - 10; // every point over 10 costs 1
    }
  }

  // ---------- 4. Scoring ----------
  let score = 100;
  score -= lintErrors * 2;      // each ESLint error –2
  score -= complexityPenalty;   // each CC point over budget –1
  score = Math.max(0, score);

  const rating =
    score >= 80 ? 'good' :
    score >= 50 ? 'not good' :
    'bad';

  const messages = [
    `${lintErrors} ESLint error(s)`,
    ...(mode !== 'fast' ? [`${complexityPenalty} complexity penalty`] : []),
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
