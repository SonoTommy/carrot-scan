export interface Component {
    name: string;
    version: string;
    licenses?: string | string[];
    purl: string;
}
/**
 * Legge package-lock e node_modules e restituisce la lista componenti
 * @param projectPath percorso root progetto (default ".")
 * @param includeDev  se includere devDependencies
 */
export declare function collectComponents(projectPath?: string, includeDev?: boolean): Promise<Component[]>;
