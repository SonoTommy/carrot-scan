import fs from 'node:fs/promises';
import path from 'node:path';

const BAD_PATTERNS = [
  /eval\s*\(/gi,
  /exec\s*(?:Sync)?\s*\(/gi,
  /system\s*\(/gi,
  /include\s*\(/gi,
  /require\s*\(/gi,
  /mysqli_query\s*\(/gi,
  /\$_(GET|POST|REQUEST)\b/gi,
  /\bSELECT\s+.*\bFROM\b.*\bWHERE\b/gi,
  /base64_decode\s*\(/gi,
  /new Function\s*\(/gi,
  /shell_exec\s*\(/gi,
  /popen\s*\(/gi,
  /passthru\s*\(/gi,
  /proc_open\s*\(/gi,
  /pcntl_exec\s*\(/gi,
  /preg_replace\s*\(.*\/e/gi,
];

function heuristicBadness(text) {
  return BAD_PATTERNS.reduce((count, re) => {
    const matches = text.match(re);
    return count + (matches ? matches.length : 0);
  }, 0);
}

export const heuristic = {
  name: 'heuristic',
  scope: 'all',
  applies: () => true,
  async run(files) {
    let count = 0;
    for (const f of files) {
      const text = await fs.readFile(f, 'utf8');
      count += heuristicBadness(text);
    }
    return count;
  },
};
