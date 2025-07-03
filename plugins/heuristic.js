import fs from 'node:fs/promises';
import path from 'node:path';
import { Plugin } from '../src/plugin-interface.js';

const BAD_PATTERNS = [
  { pattern: /eval\s*\(/gi, message: 'Use of eval() detected' },
  { pattern: /exec\s*(?:Sync)?\s*\(/gi, message: 'Use of exec() detected' },
  { pattern: /system\s*\(/gi, message: 'Use of system() detected' },
  { pattern: /include\s*\(/gi, message: 'Use of include() detected' },
  { pattern: /require\s*\(/gi, message: 'Use of require() detected' },
  { pattern: /mysqli_query\s*\(/gi, message: 'Use of mysqli_query() detected' },
  { pattern: /\$_(GET|POST|REQUEST)\b/gi, message: 'Use of superglobal GET/POST/REQUEST detected' },
  { pattern: /\bSELECT\s+.*\bFROM\b.*\bWHERE\b/gi, message: 'SQL SELECT statement detected' },
  { pattern: /base64_decode\s*\(/gi, message: 'Use of base64_decode() detected' },
  { pattern: /new Function\s*\(/gi, message: 'Use of new Function() detected' },
  { pattern: /shell_exec\s*\(/gi, message: 'Use of shell_exec() detected' },
  { pattern: /popen\s*\(/gi, message: 'Use of popen() detected' },
  { pattern: /passthru\s*\(/gi, message: 'Use of passthru() detected' },
  { pattern: /proc_open\s*\(/gi, message: 'Use of proc_open() detected' },
  { pattern: /pcntl_exec\s*\(/gi, message: 'Use of pcntl_exec() detected' },
  { pattern: /preg_replace\s*\(.*\/e/gi, message: 'Use of preg_replace() with /e modifier detected' },
];

/**
 * Counts the number of matches for all BAD_PATTERNS in the given text.
 * @param {string} text
 * @returns {number}
 */
function heuristicBadness(text) {
  if (typeof text !== 'string' || !text) return 0;
  return BAD_PATTERNS.reduce((count, { pattern }) => {
    const matches = text.match(pattern);
    return count + (matches ? matches.length : 0);
  }, 0);
}

export class HeuristicPlugin extends Plugin {
  static pluginName = 'heuristic';

  static applies() {
    return true;
  }

  async run(filePath, { content }) {
    const messages = [];
    const lines = content.split('\n');

    for (const { pattern, message } of BAD_PATTERNS) {
      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
          messages.push({
            pluginName: this.constructor.pluginName,
            filePath,
            line: i + 1,
            column: 0,
            severity: 'warning',
            message: `${message} in line ${i + 1}`,
          });
        }
      }
    }
    return messages;
  }
}
