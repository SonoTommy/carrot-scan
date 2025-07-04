import { Plugin } from '../src/plugin-interface.js';
import fs from 'node:fs/promises';
import escomplex from 'typhonjs-escomplex';
import path from 'node:path';

export class ComplexityPlugin extends Plugin {
  static pluginName = 'complexity';

  static applies(file) {
    return ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(path.extname(file));
  }

  async run(filePath, { content }) {
    const report = escomplex.analyzeModule(content);
    const messages = [];
    for (const func of report.methods) {
      const cc = func.cyclomatic;
      if (cc > 10) {
        messages.push({
          pluginName: this.constructor.pluginName,
          filePath,
          line: func.lineStart,
          column: 0,
          severity: 'warning',
          message: `Function '${func.name}' has a cyclomatic complexity of ${cc}, which exceeds the threshold of 10`,
        });
      }
    }
    return messages;
  }
}
