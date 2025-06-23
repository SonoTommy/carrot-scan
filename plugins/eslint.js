import { createRequire } from 'node:module';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const requireCJS = createRequire(import.meta.url);
const eslintMain = requireCJS.resolve('eslint');
const eslintBin = path.resolve(path.dirname(eslintMain), '../bin/eslint.js');
const exec = promisify(execFile);

export const eslint = {
  name: 'eslint',
  scope: 'js',
  applies: file => ['.js','.jsx','.ts','.tsx','.mjs','.cjs'].includes(path.extname(file)),
  async run(files) {
    if (!files.length) return 0;
    try {
      const args = [
        '--no-eslintrc',
        '--config', 'eslint:recommended',
        '--format', 'json',
        ...files,
      ];
      const { stdout } = await exec(eslintBin, args);
      const results = JSON.parse(stdout);
      return results.reduce((sum, r) => sum + r.errorCount, 0);
    } catch {
      return 0;
    }
  },
};