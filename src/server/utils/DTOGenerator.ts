

// ==================== ГЕНЕРАТОР ФЕЙКОВЫХ ДАННЫХ ====================

export class DTOGenerator {
    private static uuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    private static randomString(min = 5, max = 20): string {
        const length = Math.floor(Math.random() * (max - min + 1)) + min;
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    private static randomNumber(min = 0, max = 1000): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private static randomEmail(): string {
        return `${this.randomString(5, 10)}@${this.randomString(5, 10)}.com`.toLowerCase();
    }

    private static randomDate(): string {
        const start = new Date(2020, 0, 1);
        const end = new Date();
        const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        return date.toISOString();
    }

    private static generateValue(field: FieldSchema): any {
        if (field.enum) {
            return field.enum[Math.floor(Math.random() * field.enum.length)];
        }

        switch (field.type) {
            case 'string':
                return this.randomString(field.min, field.max);

            case 'number':
                return this.randomNumber(field.min, field.max);

            case 'boolean':
                return Math.random() > 0.5;

            case 'date':
                return this.randomDate();

            case 'email':
                return this.randomEmail();

            case 'uuid':
                return this.uuid();

            case 'array':
                const arrayLength = field.min || 2;
                const maxLength = field.max || 5;
                const length = Math.floor(Math.random() * (maxLength - arrayLength + 1)) + arrayLength;
                return Array.from({ length }, () =>
                    field.itemType ? this.generateValue(field.itemType) : null
                );

            case 'object':
                if (field.fields) {
                    return this.generate(field.fields);
                }
                return {};

            default:
                return null;
        }
    }

    static generate(schema: Schema): Record<string, any> {
        const result: Record<string, any> = {};

        for (const [key, field] of Object.entries(schema)) {
            if (field.required !== false) {
                result[key] = this.generateValue(field);
            } else if (Math.random() > 0.3) {
                result[key] = this.generateValue(field);
            }
        }

        return result;
    }

    static generateMany(schema: Schema, count: number): Record<string, any>[] {
        return Array.from({ length: count }, () => this.generate(schema));
    }
}



