import fs from 'node:fs/promises';
import path from 'node:path';
import { globby } from 'globby';

// Plugins
import { critical } from './plugins/critical.js';
import { eslint } from './plugins/eslint.js';
import { complexity } from './plugins/complexity.js';
import { xray } from './plugins/xray.js';
import { semgrep } from './plugins/semgrep.js';
import { heuristic } from './plugins/heuristic.js';
import { audit } from './plugins/audit.js';

// Plugin list in desired order
const plugins = [critical, eslint, complexity, xray, semgrep, heuristic, audit];

// Default weightings (can override via config file)
const defaultWeights = {
  critical:   50,   // immediate-fail severity
  eslint:     2,    // per error
  complexity: 1,    // per point over threshold
  xray:       8,    // per warning
  semgrep:    5,    // per finding
  heuristic:  3,    // per pattern
  audit:      4,    // per vuln severity unit
};

/**
 * Scan entrypoint.
 * @param {string} target - file or directory
 * @param {{mode:'fast'|'default'|'complete'}} opts
 */
export async function scan(target, { mode = 'default' } = {}) {
  // 1. File discovery
  const stats = await fs.stat(target);
  const allFiles = stats.isDirectory()
    ? await globby(['**/*'], { cwd: target, gitignore: true, absolute: true, onlyFiles: true, dot: true })
    : [path.resolve(target)];
  if (!allFiles.length) return { target, mode, score: 100, rating: 'good', messages: ['No files to scan'], exitCode: 0 };

  // 2. Plugin results collection
  const results = [];
  for (const plugin of plugins) {
    const files = plugin.scope === 'js'
      ? allFiles.filter(f => plugin.applies(f))
      : allFiles;
    if (!files.length) continue;
    const count = await plugin.run(files, { target, mode });
    results.push({ name: plugin.name, count });
    if (plugin.name === 'critical' && count > 0) {
      // Immediate fail on critical patterns
      return { target, mode, score: 0, rating: 'bad', messages: [`${count} critical issues`] , exitCode: 2 };
    }
  }

  // 3. Scoring: weighted sum with normalized caps
  let score = 100;
  const messages = [];
  for (const { name, count } of results) {
    if (!count) continue;
    const weight = defaultWeights[name] ?? 1;
    const penalty = weight * count;
    score -= penalty;
    // Detailed message
    messages.push(`${count} ${name} issue(s) (-${penalty})`);
  }
  score = Math.max(0, score);

  // 4. Final verdict
  const rating = score >= 90 ? 'excellent'
               : score >= 75 ? 'good'
               : score >= 50 ? 'fair'
               : score >= 25 ? 'poor'
               : 'bad';

  return { target, mode, score, rating, messages, exitCode: rating === 'bad' ? 2 : rating === 'poor' ? 1 : 0 };
}
