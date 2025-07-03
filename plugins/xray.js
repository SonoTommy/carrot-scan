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
    const messages = [];
    if (warnings && warnings.length > 0) {
      for (const warning of warnings) {
        messages.push({
          pluginName: this.constructor.pluginName,
          filePath,
          line: warning.location ? warning.location.start.line : 0,
          column: warning.location ? warning.location.start.column : 0,
          severity: 'warning',
          message: warning.message,
        });
      }
    }
    return messages;
  }
}
