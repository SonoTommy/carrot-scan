import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { Plugin } from '../src/plugin-interface.js';

const exec = promisify(execFile);

export class SemgrepPlugin extends Plugin {
  static pluginName = 'semgrep';

  static applies(filePath) {
    const ext = path.extname(filePath);
    return ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.java', '.go', '.php', '.rb', '.cs', '.c', '.cpp', '.h', '.hpp', '.xml', '.json', '.yaml', '.yml'].includes(ext);
  }

  async run(_filePath, { target }) {
    try {
      const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      const args = ['semgrep', '--quiet', '--json', '--config', 'p/owasp-top-ten', target];
      const { stdout } = await exec(cmd, args, { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 });
      const report = JSON.parse(stdout);
      const messages = [];
      if (Array.isArray(report.results)) {
        for (const result of report.results) {
          messages.push({
            pluginName: this.constructor.pluginName,
            filePath: result.path,
            line: result.start.line,
            column: result.start.col,
            severity: result.extra.severity.toLowerCase(),
            message: result.extra.message,
          });
        }
      }
      return messages;
    } catch {
      // ignore
    }
    return [];
  }
}
