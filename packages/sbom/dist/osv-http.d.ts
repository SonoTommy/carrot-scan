import type { Component } from './collector';
export interface Advisory {
    id: string;
    summary: string;
    severity?: string;
}
/**
 * Aggiunge la chiave `advisories` a ogni componente.
 * Modifica l'array in-place, non restituisce nulla.
 */
export declare function enrichWithOSV(components: Component[]): Promise<void>;
