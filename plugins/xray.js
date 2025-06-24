import { AstAnalyser } from '@nodesecure/js-x-ray';
import path from 'node:path';

const xrayInstance = new AstAnalyser();

export const xray = {
  name: 'xray',
  scope: 'js',
  applies: (file) => ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(path.extname(file)),
  async run(files) {
    let count = 0;
    for (const f of files) {
      const { warnings } = await xrayInstance.analyseFile(f);
      if (warnings) count += warnings.length;
    }
    return count;
  },
};
