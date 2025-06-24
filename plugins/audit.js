import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

async function runNpmAudit(cwd) {
  try {
    const { stdout } = await exec('npm', ['audit', '--json'], { cwd });
    const audit = JSON.parse(stdout);
    const vulns = audit.vulnerabilities || audit;
    let critical = 0,
      high = 0,
      moderate = 0;
    for (const v of Object.values(vulns)) {
      critical += v.critical || 0;
      high += v.high || 0;
      moderate += v.moderate || 0;
    }
    return critical * 5 + high * 5 + moderate * 2;
  } catch {
    return 0;
  }
}

export const audit = {
  name: 'audit',
  scope: 'all',
  applies: () => true,
  async run(_files, { target }) {
    return await runNpmAudit(path.resolve(target));
  },
};
