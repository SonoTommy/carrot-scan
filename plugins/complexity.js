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
    const cc = report.aggregate.cyclomatic;
    if (cc > 10) {
      return [{
        pluginName: this.constructor.pluginName,
        filePath,
        line: 0,
        column: 0,
        severity: 'warning',
        message: `Cyclomatic complexity ${cc} exceeds threshold of 10`,
      }];
    }
    return [];
  }
}
