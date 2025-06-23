import fs from 'node:fs/promises';
import escomplex from 'typhonjs-escomplex';
import path from 'node:path';

export const complexity = {
  name: 'complexity',
  scope: 'js',
  applies: file => ['.js','.jsx','.ts','.tsx','.mjs','.cjs'].includes(path.extname(file)),
  async run(files) {
    let penalty = 0;
    for (const f of files) {
      const src = await fs.readFile(f, 'utf8');
      const report = escomplex.analyzeModule(src);
      const cc = report.aggregate.cyclomatic;
      if (cc > 10) penalty += cc - 10;
    }
    return penalty;
  },
};
