import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const exec = promisify(execFile);

export const semgrep = {
  name: 'semgrep',
  scope: 'all',
  applies: () => true,
  async run(_files, { target }) {
    try {
      const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      const args = ['semgrep', '--quiet', '--json', '--config', 'p/owasp-top-ten', target];
      const { stdout } = await exec(cmd, args, { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 });
      const report = JSON.parse(stdout);
      return Array.isArray(report.results) ? report.results.length : 0;
    } catch {
      return 0;
    }
  },
};
