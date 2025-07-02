// Stub declaration for cyclonedx-bom to satisfy TypeScript
// File: packages/sbom/src/types/cyclonedx-bom.d.ts

declare module 'cyclonedx-bom' {
  /**
   * Class used to build a CycloneDX Bill of Materials
   * @see https://github.com/CycloneDX/cyclonedx-javascript-library
   */
  export class Bom {
    metadata?: Record<string, any>;
    components?: Array<Record<string, any>>;
    /**
     * Serializes the BOM instance to XML
     * @param bom - an instance of Bom
     * @returns XML string representing the BOM
     */
    static toXML(bom: Bom): string;
  }
}
