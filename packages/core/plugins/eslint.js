import { createRequire } from 'node:module';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Plugin } from '../src/plugin-interface.js';

const requireCJS = createRequire(import.meta.url);
const eslintMain = requireCJS.resolve('eslint');
const eslintBin = path.resolve(path.dirname(eslintMain), '../bin/eslint.js');
const exec = promisify(execFile);

export class ESLintPlugin extends Plugin {
  static pluginName = 'eslint';

  static applies(file) {
    return ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(path.extname(file));
  }

  async run(filePath, { content }) {
    try {
      const args = [filePath, '--format', 'json'];
      const { stdout } = await exec(eslintBin, args);
      const results = JSON.parse(stdout);
      const errorCount = results.reduce((sum, r) => sum + r.errorCount, 0);
      if (errorCount > 0) {
        return [
          {
            pluginName: this.constructor.pluginName,
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