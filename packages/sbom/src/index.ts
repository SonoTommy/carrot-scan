#!/usr/bin/env node
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { collectComponents } from './collector.js';
import { enrichWithOSV } from './osv-http.js';
import { writeCycloneDX } from './writer-cdx.js';
import { writeSarif } from './writer-sarif.js';

export interface SBOMOpts {
  format: 'cyclonedx' | 'sarif';
  includeDev?: boolean;
  output?: string;
}

export async function generateSBOM(
  project = '.',
  opts: SBOMOpts = { format: 'cyclonedx' }
) {
  const out =
    opts.output ??
    (opts.format === 'sarif' ? 'sbom.sarif' : 'sbom.xml');
  mkdirSync(dirname(out), { recursive: true });

  const comps = await collectComponents(project, opts.includeDev);
  await enrichWithOSV(comps);

  opts.format === 'sarif'
    ? writeSarif(comps, out)
    : writeCycloneDX(comps, out);

  console.log(`✔ SBOM generato: ${out}`);
}

/* ---------- CLI minimal ---------- */
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const [, , pathArg = '.', ...flags] = process.argv;
  await generateSBOM(pathArg, {
    format: flags.includes('--sarif') ? 'sarif' : 'cyclonedx',
    includeDev: flags.includes('--dev')
  });
}