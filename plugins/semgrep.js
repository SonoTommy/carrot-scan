import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { Plugin } from '../src/plugin-interface.js';

const exec = promisify(execFile);

export class SemgrepPlugin extends Plugin {
  static pluginName = 'semgrep';

  static applies() {
    return true;
  }

  async run(_filePath, { target }) {
    try {
      const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      const args = ['semgrep', '--quiet', '--json', '--config', 'p/owasp-top-ten', target];
      const { stdout } = await exec(cmd, args, { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 });
      const report = JSON.parse(stdout);
      const count = Array.isArray(report.results) ? report.results.length : 0;
      if (count > 0) {
        return [
          {
            pluginName: this.constructor.pluginName,
            filePath: target,
            line: 0,
            column: 0,
            severity: 'warning',
            message: `${count} semgrep issues detected`,
          },
        ];
      }
    } catch {
      // ignore
    }
    return [];
  }
}
