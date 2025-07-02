import fs from 'node:fs/promises';
import path from 'node:path';
import { Plugin } from '../src/plugin-interface.js';

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

/**
 * Counts the number of matches for all BAD_PATTERNS in the given text.
 * @param {string} text
 * @returns {number}
 */
function heuristicBadness(text) {
  if (typeof text !== 'string' || !text) return 0;
  return BAD_PATTERNS.reduce((count, re) => {
    const matches = text.match(re);
    return count + (matches ? matches.length : 0);
  }, 0);
}

export class HeuristicPlugin extends Plugin {
  static pluginName = 'heuristic';

  static applies() {
    return true;
  }

  async run(filePath, { content }) {
    const count = heuristicBadness(content);
    if (count > 0) {
      return [
        {
          pluginName: this.constructor.pluginName,
          filePath,
          line: 0,
          column: 0,
          severity: 'warning',
          message: `${count} heuristic issues detected`,
        },
      ];
    }
    return [];
  }
}
