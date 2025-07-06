import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';

export async function getFileHash(filePath: string): Promise<string> {
  const fileContent = await fs.readFile(filePath);
  return createHash('sha256').update(fileContent).digest('hex');
}
