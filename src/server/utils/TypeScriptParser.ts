import type { FieldSchema, Schema } from "./types.ts";

export class TypeScriptParser {
    private static indent(level: number): string {
        return '  '.repeat(level);
    }

    private static fieldToType(field: FieldSchema): string {
        if (field.enum) {
            return field.enum.map(v => typeof v === 'string' ? `'${v}'` : v).join(' | ');
        }

        switch (field.type) {
            case 'string':
            case 'email':
            case 'uuid':
            case 'date':
                return 'string';

            case 'number':
                return 'number';

            case 'boolean':
                return 'boolean';

            case 'array':
                const itemType = field.itemType ? this.fieldToType(field.itemType) : 'any';
                return `${itemType}[]`;

            case 'object':
                if (field.fields) {
                    return this.schemaToInterface(field.fields, 1);
                }
                return 'object';

            default:
                return 'any';
        }
    }

    private static schemaToInterface(schema: Schema, indentLevel = 0): string {
        const lines: string[] = ['{'];

        for (const [key, field] of Object.entries(schema)) {
            const optional = field.required === false ? '?' : '';
            const type = this.fieldToType(field);
            lines.push(`${this.indent(indentLevel + 1)}${key}${optional}: ${type};`);
        }

        lines.push(`${this.indent(indentLevel)}}`);
        return lines.join('\n');
    }

    static generateInterface(interfaceName: string, schema: Schema): string {
        return `interface ${interfaceName} ${this.schemaToInterface(schema)}`;
    }

    static generateType(typeName: string, schema: Schema): string {
        return `type ${typeName} = ${this.schemaToInterface(schema)}`;
    }
}