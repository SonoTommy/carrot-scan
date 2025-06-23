import fs from 'node:fs/promises';

export const critical = {
  name: 'critical',
  scope: 'all',           // scans all files
  applies: () => true,
  async run(allFiles) {
    const patterns = [
      /rm\s+-rf\s+\//gi,
      /eval\s*\(/gi,
      // add more...
    ];
    let count = 0;
    for (const f of allFiles) {
      const txt = await fs.readFile(f, 'utf8');
      for (const re of patterns) {
        const m = txt.match(re);
        if (m) count += m.length;
      }
    }
    return count;
  },
};