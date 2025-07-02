import fetch from 'node-fetch'; // se usi Node 20+ puoi sostituire con globalThis.fetch
import pLimit from 'p-limit';
const CONCURRENCY = 4; // max richieste parallele
const BATCH_SIZE = 100; // pacchetti per chiamata
const limit = pLimit(CONCURRENCY);
/**
 * Aggiunge la chiave `advisories` a ogni componente.
 * Modifica l'array in-place, non restituisce nulla.
 */
export async function enrichWithOSV(components) {
    // suddividi in blocchi da 100
    for (let i = 0; i < components.length; i += BATCH_SIZE) {
        const chunk = components.slice(i, i + BATCH_SIZE);
        await limit(() => queryBatch(chunk));
    }
}
async function queryBatch(chunk) {
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
    if (!res.ok)
        throw new Error(`OSV ${res.status} ${res.statusText}`);
    const data = await res.json();
    data.results.forEach((r, idx) => {
        const vulns = (r.vulns ?? []).map(v => ({
            id: v.id,
            summary: v.summary,
            severity: v.severity?.[0]?.score
        }));
        // aggiungi all’oggetto componente corrispondente
        chunk[idx].advisories = vulns;
    });
}
