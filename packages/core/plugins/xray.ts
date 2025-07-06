import { AstAnalyser } from '@nodesecure/js-x-ray';
import path from 'node:path';
import { Plugin, PluginResult, Severity } from '../src/plugin-interface';
import fs from 'node:fs/promises';

const xrayInstance = new AstAnalyser();

export class XrayPlugin extends Plugin {
  static pluginName = 'xray';

  static applies(filePath: string): boolean {
    return ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(path.extname(filePath));
  }

  async run(filePath: string, _content: { content: string }): Promise<PluginResult[]> {
    const { warnings } = await xrayInstance.analyseFile(filePath);
    const messages: PluginResult[] = [];
    if (warnings && warnings.length > 0) {
      for (const warning of warnings) {
        messages.push({
          pluginName: (this.constructor as typeof Plugin).pluginName,
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