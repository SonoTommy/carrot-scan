
import { Plugin } from '../src/plugin-interface.js';
import fetch from 'node-fetch';

export class OsvPlugin extends Plugin {
  static pluginName = 'osv';

  static applies(filePath) {
    return filePath.endsWith('package.json');
  }

  async run(filePath, { content }) {
    const messages = [];
    try {
      const packageJson = JSON.parse(content);
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      const queries = Object.entries(dependencies).map(([name, version]) => ({
        package: {
          ecosystem: 'npm',
          name,
          version,
        },
      }));

      if (queries.length === 0) {
        return [];
      }

      const res = await fetch('https://api.osv.dev/v1/querybatch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ queries }),
      });

      if (!res.ok) {
        // Don't throw an error, just log it and return no messages
        console.error(`OSV API request failed: ${res.status} ${res.statusText}`);
        return [];
      }

      const data = await res.json();

      if (data.results) {
        data.results.forEach((result, index) => {
          if (result.vulns) {
            const packageName = queries[index].package.name;
            result.vulns.forEach((vuln) => {
              messages.push({
                pluginName: this.constructor.pluginName,
                filePath,
                line: 0, // Vulnerabilities are not tied to a specific line
                column: 0,
                severity: 'error',
                message: `[${packageName}] ${vuln.id}: ${vuln.summary}`,
              });
            });
          }
        });
      }
    } catch (error) {
      console.error('Error parsing package.json or fetching OSV data:', error);
    }

    return messages;
  }
}
