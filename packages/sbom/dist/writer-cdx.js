import fs from 'node:fs';
/**
 * Write a CycloneDX BOM XML file manually, with basic components and licenses
 */
export function writeCycloneDX(components, file) {
    const lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<bom xmlns="http://cyclonedx.org/schema/bom/1.4" version="1">');
    lines.push('  <components>');
    for (const c of components) {
        lines.push('    <component type="library">');
        lines.push(`      <name>${c.name}</name>`);
        lines.push(`      <version>${c.version}</version>`);
        if (c.licenses) {
            const licenses = Array.isArray(c.licenses) ? c.licenses : [c.licenses];
            lines.push('      <licenses>');
            for (const l of licenses) {
                lines.push(`        <license><id>${l}</id></license>`);
            }
            lines.push('      </licenses>');
        }
        lines.push('    </component>');
    }
    lines.push('  </components>');
    lines.push('</bom>');
    fs.writeFileSync(file, lines.join('\n'));
}
