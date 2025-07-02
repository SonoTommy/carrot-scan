import fs from 'node:fs';
export function writeSarif(components, file) {
    const log = {
        $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
        version: '2.1.0',
        runs: [
            {
                tool: { driver: { name: 'carrot-scan-sbom' } },
                results: []
            }
        ]
    };
    components.forEach(c => {
        c.advisories?.forEach((a) => {
            log.runs[0].results.push({
                ruleId: a.id,
                message: { text: a.summary },
                properties: a.severity ? { severity: a.severity } : undefined,
                locations: [
                    {
                        physicalLocation: {
                            artifactLocation: { uri: c.purl }
                        }
                    }
                ]
            });
        });
    });
    fs.writeFileSync(file, JSON.stringify(log, null, 2));
}
