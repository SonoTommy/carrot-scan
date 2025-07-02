import { promisify } from 'node:util';
import * as licenseChecker from 'license-checker-rseidelsohn';

export interface Component {
  name: string;
  version: string;
  licenses?: string | string[];
  purl: string;             // es. pkg:npm/lodash@4.17.21
}

const init = promisify(licenseChecker.init);

/**
 * Legge package-lock e node_modules e restituisce la lista componenti
 * @param projectPath percorso root progetto (default ".")
 * @param includeDev  se includere devDependencies
 */
export async function collectComponents(
  projectPath = '.',
  includeDev = false
): Promise<Component[]> {
  const data = await init({ start: projectPath, production: !includeDev });
  return Object.entries(data).map(([pkg, meta]: [string, any]) => {
    // pkg è 'nome@versione'
    const at = pkg.lastIndexOf('@');
    const name = pkg.slice(0, at);
    const version = pkg.slice(at + 1);
    return {
      name,
      version,
      licenses: meta.licenses,
      purl: `pkg:npm/${name}@${version}`
    };
  });
}