import fs from 'node:fs';
import type { Log } from 'sarif';
import type { Component } from './collector.js';

export function writeSarif(components: Component[], file: string) {
  const log: Log = {
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
    (c as any).advisories?.forEach((a: any) => {
      log.runs![0].results!.push({
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