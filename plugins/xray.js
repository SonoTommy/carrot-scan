import { AstAnalyser } from '@nodesecure/js-x-ray';
import path from 'node:path';
import { Plugin } from '../src/plugin-interface.js';
import fs from 'node:fs/promises';

const xrayInstance = new AstAnalyser();

export class XrayPlugin extends Plugin {
  static pluginName = 'xray';

  static applies(filePath) {
    return ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(path.extname(filePath));
  }

  async run(filePath, _content) {
    const { warnings } = await xrayInstance.analyseFile(filePath);
    const count = warnings ? warnings.length : 0;
    if (count > 0) {
      return [{
        pluginName: this.constructor.pluginName,
        filePath,
        line: 0,
        column: 0,
        severity: 'warning',
        message: `${count} AST warnings detected`,
      }];
    }
    return [];
  }
}
