import { promisify } from 'node:util';
import * as licenseChecker from 'license-checker-rseidelsohn';
const init = promisify(licenseChecker.init);
/**
 * Legge package-lock e node_modules e restituisce la lista componenti
 * @param projectPath percorso root progetto (default ".")
 * @param includeDev  se includere devDependencies
 */
export async function collectComponents(projectPath = '.', includeDev = false) {
    const data = await init({ start: projectPath, production: !includeDev });
    return Object.entries(data).map(([pkg, meta]) => {
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
