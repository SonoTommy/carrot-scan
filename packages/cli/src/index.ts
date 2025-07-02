#!/usr/bin/env node
import { Command } from 'commander';
import { generateSBOM } from '../../sbom/dist/index.js';   // ← path relativo

const program = new Command();

program
  .name('carrot-scan')
  .description('Swiss-army knife per la qualità del codice 🥕');

program
  .command('sbom [path]')
  .description('Generate SBOM + CVE report (CycloneDX XML or SARIF)')
  .option('--sarif', 'output SARIF instead of CycloneDX')
  .option('--dev', 'include devDependencies')
  .option('-o, --output <file>', 'output file path')
  .action((path = '.', opts) =>
    generateSBOM(path, {
      format: opts.sarif ? 'sarif' : 'cyclonedx',
      includeDev: opts.dev,
      output: opts.output
    })
  );

program.parse();