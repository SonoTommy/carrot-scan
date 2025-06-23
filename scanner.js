import fs from 'fs/promises';
import path from 'path';
import { globby } from 'globby';

/**
 * Quick-and-dirty analyser.
 * @param {string} target Path to file or directory
 * @param {{mode:'fast'|'complete'|'default'}} opts
 */
export async function scan(target, { mode = 'default' } = {}) {
  const stats = await fs.stat(target);

  // Collect JS / TS files
  const files = stats.isDirectory()
    ? await globby(['**/*.js', '**/*.ts'], { cwd: target, gitignore: true, absolute: true })
    : [path.resolve(target)];

  // Dummy rule: every TODO counts as an "issue"
  let issues = 0;
  for (const file of files) {
    const text = await fs.readFile(file, 'utf8');
    issues += (text.match(/TODO/gi) || []).length;
  }

  // Simple score & rating mapping
  const score = Math.max(0, 100 - issues * 10);
  const rating = score >= 80 ? 'good' : score >= 50 ? 'not good' : 'bad';

  return {
    target,
    mode,
    score,
    rating,
    messages: [`${issues} issue(s) across ${files.length} file(s).`],
    exitCode: rating === 'good' ? 0 : rating === 'not good' ? 1 : 2
  };
}
