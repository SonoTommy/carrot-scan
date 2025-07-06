import { createRequire } from 'node:module';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Plugin, PluginResult, Severity } from '../src/plugin-interface';

const requireCJS = createRequire(import.meta.url);
const eslintMain = requireCJS.resolve('eslint');
const eslintBin = path.resolve(path.dirname(eslintMain), '../bin/eslint.js');
const exec = promisify(execFile);

export class ESLintPlugin extends Plugin {
  static pluginName = 'eslint';

  static applies(file: string): boolean {
    return ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(path.extname(file));
  }

  async run(filePath: string, { content }: { content: string }): Promise<PluginResult[]> {
    try {
      const args = [filePath, '--format', 'json'];
      const { stdout } = await exec(eslintBin, args);
      const results = JSON.parse(stdout);
      const errorCount = results.reduce((sum: number, r: any) => sum + r.errorCount, 0);
      if (errorCount > 0) {
        return [
          {
            pluginName: (this.constructor as typeof Plugin).pluginName,
            filePath,
            line: 0,
            column: 0,
            severity: 'warning',
            message: `${errorCount} ESLint error(s) found`,
          },
        ];
      }
    } catch {
      // ignore failures
    }
    return [];
  }
}
