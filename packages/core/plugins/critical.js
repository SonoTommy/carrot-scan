import { Plugin } from '../src/plugin-interface.js';
import fs from 'node:fs/promises';

export class CriticalPlugin extends Plugin {
  static pluginName = 'critical';

  static applies(filePath) {
    return true; // scan all files
  }

  async run(filePath, { content }) {
    const patterns = [
      { pattern: /rm\s+-rf\s+\//gi, message: 'Potential dangerous command: rm -rf /' },
      { pattern: /eval\s*\(/gi, message: 'Use of eval() detected' },
      // add more patterns as needed
    ];
    const messages = [];
    const lines = content.split('\n');

    for (const { pattern, message } of patterns) {
      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
          messages.push({
            pluginName: this.constructor.pluginName,
            filePath,
            line: i + 1,
            column: 0,
            severity: 'error',
            message: `${message} in line ${i + 1}`,
          });
        }
      }
    }
    return messages;
  }
}
