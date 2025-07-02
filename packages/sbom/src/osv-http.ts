import fetch from 'node-fetch';          // se usi Node 20+ puoi sostituire con globalThis.fetch
import pLimit from 'p-limit';
import type { Component } from './collector';

export interface Advisory {
  id: string;          // es. CVE-2024-1234
  summary: string;
  severity?: string;   // CVSS score se presente
}

const CONCURRENCY = 4;     // max richieste parallele
const BATCH_SIZE  = 100;   // pacchetti per chiamata
const limit = pLimit(CONCURRENCY);

/**
 * Aggiunge la chiave `advisories` a ogni componente.
 * Modifica l'array in-place, non restituisce nulla.
 */
export async function enrichWithOSV(components: Component[]): Promise<void> {
  // suddividi in blocchi da 100
  for (let i = 0; i < components.length; i += BATCH_SIZE) {
    const chunk = components.slice(i, i + BATCH_SIZE);
    await limit(() => queryBatch(chunk));
  }
}

async function queryBatch(chunk: Component[]) {
  const body = {
    queries: chunk.map(c => ({
      package: {
        ecosystem: 'npm',
        name: c.name,
        version: c.version
      }
    }))
  };

  const res = await fetch('https://api.osv.dev/v1/querybatch', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(`OSV ${res.status} ${res.statusText}`);
const data = await res.json() as { results: { vulns?: any[] }[] };
  data.results.forEach((r, idx) => {
    const vulns: Advisory[] =
      (r.vulns ?? []).map(v => ({
        id: v.id,
        summary: v.summary,
        severity: v.severity?.[0]?.score
      }));
    // aggiungi all’oggetto componente corrispondente
    (chunk[idx] as any).advisories = vulns;
  });
}