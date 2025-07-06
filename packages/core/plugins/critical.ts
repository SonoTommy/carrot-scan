import { Plugin, PluginResult, Severity } from '../src/plugin-interface';
import fs from 'node:fs/promises';

export class CriticalPlugin extends Plugin {
  static pluginName = 'critical';

  static applies(filePath: string): boolean {
    return true; // scan all files
  }

  async run(filePath: string, { content }: { content: string }): Promise<PluginResult[]> {
    const patterns = [
      { pattern: /rm\s+-rf\s+\//gi, message: 'Potential dangerous command: rm -rf /' },
      { pattern: /eval\s*\(/gi, message: 'Use of eval() detected' },
      // add more patterns as needed
    ];
    const messages: PluginResult[] = [];
    const lines = content.split('\n');

    for (const { pattern, message } of patterns) {
      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
          messages.push({
            pluginName: (this.constructor as typeof Plugin).pluginName,
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