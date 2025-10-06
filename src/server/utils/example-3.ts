// Типы для парсера
type Decorator = {
    name: string;
    args: any[];
};

type FieldType = {
    baseType: string;
    isArray: boolean;
    isNullable: boolean;
    isUnion: boolean;
    unionTypes?: string[];
};

type Field = {
    name: string;
    type: FieldType;
    decorators: Decorator[];
};

type Model = {
    name: string;
    fields: Field[];
};

type SchemaField = {
    isShow: boolean;
    disabled: boolean;
    defaultValue: any;
    required: boolean;
    check: boolean;
    children?: Record<string, SchemaField>;
};

// Парсер DSL
class DSLParser {
    private models: Map<string, Model> = new Map();
    private input: string = '';
    private pos: number = 0;

    parse(dsl: string): { schema: Record<string, SchemaField>; types: string } {
        this.input = dsl;
        this.pos = 0;
        this.models.clear();

        this.parseModels();

        const mainModel = Array.from(this.models.values()).pop();
        if (!mainModel) {
            throw new Error('Не найдено ни одной модели');
        }

        const schema = this.generateSchema(mainModel);
        const types = this.generateTypes();

        return { schema, types };
    }

    private parseModels(): void {
        while (this.pos < this.input.length) {
            this.skipWhitespace();
            if (this.pos >= this.input.length) break;

            if (this.peek('model')) {
                this.parseModel();
            } else {
                this.pos++;
            }
        }
    }

    private parseModel(): void {
        this.consume('model');
        this.skipWhitespace();

        const name = this.parseIdentifier();
        this.skipWhitespace();
        this.consume('{');

        const fields: Field[] = [];

        while (!this.peek('}')) {
            this.skipWhitespace();
            if (this.peek('}')) break;

            const field = this.parseField();
            if (field) {
                fields.push(field);
            }
        }

        this.consume('}');
        this.models.set(name, { name, fields });
    }

    private parseField(): Field | null {
        this.skipWhitespace();

        const fieldName = this.parseIdentifier();
        if (!fieldName) return null;

        this.skipWhitespace();
        this.consume(':');
        this.skipWhitespace();

        const type = this.parseType();
        const decorators = this.parseDecorators();

        this.skipWhitespace();
        if (this.peek(';')) {
            this.consume(';');
        }

        return { name: fieldName, type, decorators };
    }

    private parseType(): FieldType {
        this.skipWhitespace();

        let baseType = '';
        let isNullable = false;
        let isArray = false;
        let isUnion = false;
        let unionTypes: string[] = [];

        // Проверяем на union типы (например, "admin" | "user")
        if (this.peek('"') || this.peek("'")) {
            const unionValues: string[] = [];
            while (true) {
                this.skipWhitespace();
                if (this.peek('"') || this.peek("'")) {
                    unionValues.push(this.parseString());
                }
                this.skipWhitespace();
                if (this.peek('|')) {
                    this.consume('|');
                    continue;
                }
                break;
            }
            if (unionValues.length > 1) {
                isUnion = true;
                unionTypes = unionValues;
                baseType = 'string';
            } else if (unionValues.length === 1) {
                baseType = 'string';
            }
        } else {
            // Парсим обычный тип
            baseType = this.parseIdentifier();

            // Проверяем на | null
            this.skipWhitespace();
            if (this.peek('|')) {
                this.consume('|');
                this.skipWhitespace();
                if (this.peek('null')) {
                    this.consume('null');
                    isNullable = true;
                }
            }
        }

        // Проверяем на массив
        this.skipWhitespace();
        if (this.peek('[')) {
            this.consume('[');
            this.consume(']');
            isArray = true;
        }

        return { baseType, isArray, isNullable, isUnion, unionTypes };
    }

    private parseDecorators(): Decorator[] {
        const decorators: Decorator[] = [];

        while (this.peek('@')) {
            this.consume('@');
            const name = this.parseIdentifier();
            let args: any[] = [];

            if (this.peek('(')) {
                this.consume('(');
                args = this.parseDecoratorArgs();
                this.consume(')');
            }

            decorators.push({ name, args });
            this.skipWhitespace();
        }

        return decorators;
    }

    private parseDecoratorArgs(): any[] {
        const args: any[] = [];

        while (!this.peek(')')) {
            this.skipWhitespace();

            if (this.peek('true') || this.peek('false')) {
                args.push(this.parseBoolean());
            } else if (this.peek('null')) {
                this.consume('null');
                args.push(null);
            } else if (this.peek('"') || this.peek("'")) {
                args.push(this.parseString());
            } else if (this.isDigit(this.current())) {
                args.push(this.parseNumber());
            }

            this.skipWhitespace();
            if (this.peek(',')) {
                this.consume(',');
            }
        }

        return args;
    }

    private parseString(): string {
        const quote = this.current();
        this.pos++;
        let str = '';
        while (this.pos < this.input.length && this.current() !== quote) {
            str += this.current();
            this.pos++;
        }
        this.pos++;
        return str;
    }

    private parseNumber(): number {
        let num = '';
        while (this.pos < this.input.length && (this.isDigit(this.current()) || this.current() === '.')) {
            num += this.current();
            this.pos++;
        }
        return parseFloat(num);
    }

    private parseBoolean(): boolean {
        if (this.peek('true')) {
            this.consume('true');
            return true;
        }
        this.consume('false');
        return false;
    }

    private parseIdentifier(): string {
        let id = '';
        while (this.pos < this.input.length && (this.isAlpha(this.current()) || this.isDigit(this.current()) || this.current() === '_')) {
            id += this.current();
            this.pos++;
        }
        return id;
    }

    private generateSchema(model: Model): Record<string, SchemaField> {
        const schema: Record<string, SchemaField> = {};

        for (const field of model.fields) {
            const schemaField: SchemaField = {
                isShow: true,
                disabled: false,
                defaultValue: this.getDefaultValue(field),
                required: false,
                check: false,
            };

            // Обрабатываем декораторы
            for (const decorator of field.decorators) {
                if (decorator.name === 'show') {
                    schemaField.isShow = decorator.args[0] ?? true;
                } else if (decorator.name === 'value') {
                    schemaField.defaultValue = decorator.args[0];
                } else if (decorator.name === 'required') {
                    schemaField.required = true;
                }
            }

            // Если это ссылка на другую модель (массив)
            if (field.type.isArray && this.models.has(field.type.baseType)) {
                const childModel = this.models.get(field.type.baseType)!;
                schemaField.children = this.generateSchema(childModel);
            }

            schema[field.name] = schemaField;
        }

        return schema;
    }

    private getDefaultValue(field: Field): any {
        // Проверяем декоратор @value
        const valueDecorator = field.decorators.find(d => d.name === 'value');
        if (valueDecorator) {
            return valueDecorator.args[0];
        }

        // Дефолтные значения по типу
        if (field.type.isNullable) return null;
        if (field.type.isArray) return [];

        switch (field.type.baseType) {
            case 'string':
                return field.type.unionTypes?.[0] ?? '';
            case 'number':
                return 0;
            case 'boolean':
                return false;
            case 'date':
                return new Date();
            default:
                return null;
        }
    }

    private generateTypes(): string {
        let types = '';

        for (const [name, model] of this.models) {
            types += `type T${name} = {\n`;

            for (const field of model.fields) {
                const tsType = this.toTypeScriptType(field.type);
                types += `  ${field.name}: ${tsType};\n`;
            }

            types += `};\n\n`;
        }

        return types.trim();
    }

    private toTypeScriptType(type: FieldType): string {
        let baseType = type.baseType;

        // Конвертируем базовые типы
        if (baseType === 'date') {
            baseType = 'Date';
        }

        // Обрабатываем union типы
        if (type.isUnion && type.unionTypes) {
            baseType = type.unionTypes.map(t => `"${t}"`).join(' | ');
        } else if (this.models.has(baseType)) {
            baseType = `T${baseType}`;
        }

        // Добавляем модификаторы
        if (type.isArray) {
            baseType = `${baseType}[]`;
        }

        if (type.isNullable) {
            baseType = `${baseType} | null`;
        }

        return baseType;
    }

    // Вспомогательные методы
    private current(): string {
        return this.input[this.pos] || '';
    }

    private peek(str: string): boolean {
        return this.input.substring(this.pos, this.pos + str.length) === str;
    }

    private consume(str: string): void {
        if (!this.peek(str)) {
            throw new Error(`Ожидалось "${str}" на позиции ${this.pos}`);
        }
        this.pos += str.length;
    }

    private skipWhitespace(): void {
        while (this.pos < this.input.length && /\s/.test(this.current())) {
            this.pos++;
        }
        // Пропускаем комментарии
        if (this.peek('//')) {
            while (this.pos < this.input.length && this.current() !== '\n') {
                this.pos++;
            }
            this.skipWhitespace();
        }
    }

    private isAlpha(char: string): boolean {
        return /[a-zA-Z]/.test(char);
    }

    private isDigit(char: string): boolean {
        return /[0-9]/.test(char);
    }
}

// Пример использования
const dsl = `
// Было так
model Tags {
  id: number @show(false);
  name: string;
}

model User {
  id: number | null @show(false) @value(null);
  name: string @required();
  isActive: boolean @value(false);
  role: "admin" | "user" | "moderator" @value("admin");
  createdAt: date;
  tags: Tags[];
}
`;

const parser = new DSLParser();
const result = parser.parse(dsl);

console.log('Schema:');
console.log(JSON.stringify(result.schema, null, 2));

console.log('\nTypes:');
console.log(result.types);

// Экспорт
export { DSLParser, type SchemaField };