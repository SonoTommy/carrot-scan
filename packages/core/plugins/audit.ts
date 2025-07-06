import path from 'node:path';
import { Plugin, PluginResult, Severity } from '../src/plugin-interface';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

async function runNpmAudit(cwd: string): Promise<number> {
  try {
    const { stdout } = await exec('npm', ['audit', '--json'], { cwd });
    const audit = JSON.parse(stdout);
    const vulns = audit.vulnerabilities || audit;
    let critical = 0,
      high = 0,
      moderate = 0;
    for (const v of Object.values(vulns)) {
      critical += (v as any).critical || 0;
      high += (v as any).high || 0;
      moderate += (v as any).moderate || 0;
    }
    return critical * 5 + high * 5 + moderate * 2;
  } catch {
    return 0;
  }
}

export class AuditPlugin extends Plugin {
  static pluginName = 'audit';

  static applies(filePath: string): boolean {
    return path.basename(filePath) === 'package.json';
  }

  async run(_filePath: string, { target }: { target: string }): Promise<PluginResult[]> {
    const auditScore = await runNpmAudit(target);
    const severity: Severity = auditScore > 50 ? 'error' : auditScore > 20 ? 'warning' : 'info';
    return [
      {
        pluginName: (this.constructor as typeof Plugin).pluginName,
        filePath: target,
        line: 0,
        column: 0,
        severity,
        message: `npm audit score: ${auditScore}`,
      },
    ];
  }
}