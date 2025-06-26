import { Plugin } from '../src/plugin-interface.js';
import fs from 'node:fs/promises';

export class CriticalPlugin extends Plugin {
  static pluginName = 'critical';

  static applies(filePath) {
    return true; // scan all files
  }

  async run(filePath, { content }) {
    const patterns = [
      /rm\s+-rf\s+\//gi,
      /eval\s*\(/gi,
      // add more patterns as needed
    ];
    let count = 0;
    for (const re of patterns) {
      const matches = content.match(re);
      if (matches) count += matches.length;
    }
    if (count > 0) {
      return [
        {
          pluginName: this.constructor.pluginName,
          filePath,
          line: 0,
          column: 0,
          severity: 'error',
          message: `${count} critical pattern(s) detected`,
        },
      ];
    }
    return [];
  }
}
