// ============================================
// ПСЕВДО-СИНТАКСИС (TypeSpec-подобный)
// ============================================

/*
model User {
  id: uuid;
  name: string @min(3) @max(30);
  email: email;
  age?: number @min(18) @max(80);
  isActive: boolean;
  role: "admin" | "user" | "moderator";
  createdAt: date;
  tags: string[] @min(1) @max(5);
  address: Address;
  metadata?: object;
}

model Address {
  street: string;
  city: string;
  zipCode?: string @min(5) @max(10);
}
*/

// ============================================
// ТИПЫ
// ============================================

import { DTOGenerator } from "./DTOGenerator.ts";
import { TypeScriptParser } from "./TypeScriptParser.ts";

type SchemaType =
    | 'string' | 'number' | 'boolean' | 'date'
    | 'uuid' | 'email' | 'object' | 'array';

interface Constraint {
    type: 'min' | 'max' | 'enum';
    value: number | string | string[];
}

interface Field {
    name: string;
    type: SchemaType;
    isArray: boolean;
    isOptional: boolean;
    constraints: Constraint[];
    enumValues?: string[];
    fields?: Field[]; // для вложенных объектов
    itemType?: SchemaType | string; // для массивов
    customTypeName?: string; // имя кастомной модели
}

interface Model {
    name: string;
    fields: Field[];
}

// ============================================
// ТОКЕНИЗАТОР
// ============================================

type TokenType =
    | 'MODEL' | 'IDENTIFIER' | 'COLON' | 'SEMICOLON'
    | 'LBRACE' | 'RBRACE' | 'LBRACKET' | 'RBRACKET'
    | 'QUESTION' | 'PIPE' | 'AT' | 'LPAREN' | 'RPAREN'
    | 'STRING' | 'NUMBER' | 'COMMA' | 'EOF';

interface Token {
    type: TokenType;
    value: string;
    line: number;
    col: number;
}

class Lexer {
    private pos = 0;
    private line = 1;
    private col = 1;
    private input: string;

    constructor(input: string) {
        this.input = input;
    }

    private peek(): string {
        return this.input[this.pos] || '';
    }

    private advance(): string {
        const ch = this.input[this.pos++];
        if (ch === '\n') {
            this.line++;
            this.col = 1;
        } else {
            this.col++;
        }
        return ch;
    }

    private skipWhitespaceAndComments(): void {
        while (true) {
            const ch = this.peek();

            if (/\s/.test(ch)) {
                this.advance();
            } else if (ch === '/' && this.input[this.pos + 1] === '/') {
                while (this.peek() !== '\n' && this.peek() !== '') {
                    this.advance();
                }
            } else if (ch === '/' && this.input[this.pos + 1] === '*') {
                this.advance(); this.advance();
                while (!(this.peek() === '*' && this.input[this.pos + 1] === '/') && this.peek() !== '') {
                    this.advance();
                }
                this.advance(); this.advance();
            } else {
                break;
            }
        }
    }

    private readIdentifier(): string {
        let result = '';
        while (/[a-zA-Z0-9_]/.test(this.peek())) {
            result += this.advance();
        }
        return result;
    }

    private readString(): string {
        this.advance(); // skip opening quote
        let result = '';
        while (this.peek() !== '"' && this.peek() !== '') {
            result += this.advance();
        }
        this.advance(); // skip closing quote
        return result;
    }

    private readNumber(): string {
        let result = '';
        while (/[0-9]/.test(this.peek())) {
            result += this.advance();
        }
        return result;
    }

    tokenize(): Token[] {
        const tokens: Token[] = [];

        while (this.pos < this.input.length) {
            this.skipWhitespaceAndComments();

            if (this.pos >= this.input.length) break;

            const ch = this.peek();
            const line = this.line;
            const col = this.col;

            if (ch === '{') {
                tokens.push({ type: 'LBRACE', value: ch, line, col });
                this.advance();
            } else if (ch === '}') {
                tokens.push({ type: 'RBRACE', value: ch, line, col });
                this.advance();
            } else if (ch === '[') {
                tokens.push({ type: 'LBRACKET', value: ch, line, col });
                this.advance();
            } else if (ch === ']') {
                tokens.push({ type: 'RBRACKET', value: ch, line, col });
                this.advance();
            } else if (ch === ':') {
                tokens.push({ type: 'COLON', value: ch, line, col });
                this.advance();
            } else if (ch === ';') {
                tokens.push({ type: 'SEMICOLON', value: ch, line, col });
                this.advance();
            } else if (ch === '?') {
                tokens.push({ type: 'QUESTION', value: ch, line, col });
                this.advance();
            } else if (ch === '|') {
                tokens.push({ type: 'PIPE', value: ch, line, col });
                this.advance();
            } else if (ch === '@') {
                tokens.push({ type: 'AT', value: ch, line, col });
                this.advance();
            } else if (ch === '(') {
                tokens.push({ type: 'LPAREN', value: ch, line, col });
                this.advance();
            } else if (ch === ')') {
                tokens.push({ type: 'RPAREN', value: ch, line, col });
                this.advance();
            } else if (ch === ',') {
                tokens.push({ type: 'COMMA', value: ch, line, col });
                this.advance();
            } else if (ch === '"') {
                const str = this.readString();
                tokens.push({ type: 'STRING', value: str, line, col });
            } else if (/[0-9]/.test(ch)) {
                const num = this.readNumber();
                tokens.push({ type: 'NUMBER', value: num, line, col });
            } else if (/[a-zA-Z_]/.test(ch)) {
                const id = this.readIdentifier();
                if (id === 'model') {
                    tokens.push({ type: 'MODEL', value: id, line, col });
                } else {
                    tokens.push({ type: 'IDENTIFIER', value: id, line, col });
                }
            } else {
                throw new Error(`Unexpected character '${ch}' at ${line}:${col}`);
            }
        }

        tokens.push({ type: 'EOF', value: '', line: this.line, col: this.col });
        return tokens;
    }
}

// ============================================
// ПАРСЕР
// ============================================

class Parser {
    private pos = 0;
    private tokens: Token[];

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    private peek(): Token {
        return this.tokens[this.pos];
    }

    private advance(): Token {
        return this.tokens[this.pos++];
    }

    private expect(type: TokenType): Token {
        const token = this.advance();
        if (token.type !== type) {
            throw new Error(`Expected ${type} but got ${token.type} at ${token.line}:${token.col}`);
        }
        return token;
    }

    private parseConstraints(): Constraint[] {
        const constraints: Constraint[] = [];

        while (this.peek().type === 'AT') {
            this.advance(); // @
            const name = this.expect('IDENTIFIER').value;
            this.expect('LPAREN');

            if (name === 'min' || name === 'max') {
                const value = parseInt(this.expect('NUMBER').value);
                constraints.push({ type: name as 'min' | 'max', value });
            }

            this.expect('RPAREN');
        }

        return constraints;
    }

    private parseType(): { type: SchemaType | string; isArray: boolean; enumValues?: string[]; isCustomType?: boolean } {
        let type: SchemaType | string;
        let isArray = false;
        let enumValues: string[] | undefined;
        let isCustomType = false;

        const token = this.peek();

        if (token.type === 'STRING') {
            // Union type: "admin" | "user" | "moderator"
            enumValues = [];
            enumValues.push(this.advance().value);

            while (this.peek().type === 'PIPE') {
                this.advance(); // |
                enumValues.push(this.expect('STRING').value);
            }

            type = 'string';
        } else {
            const typeName = this.expect('IDENTIFIER').value;

            // Проверяем, является ли это примитивным типом
            const primitiveTypes: SchemaType[] = [
                'string', 'number', 'boolean', 'date',
                'uuid', 'email', 'object', 'array'
            ];

            if (primitiveTypes.includes(typeName as SchemaType)) {
                type = typeName as SchemaType;
            } else {
                // Это кастомный тип (модель)
                type = typeName;
                isCustomType = true;
            }

            if (this.peek().type === 'LBRACKET') {
                this.advance(); // [
                this.expect('RBRACKET'); // ]
                isArray = true;
            }
        }

        return { type, isArray, enumValues, isCustomType };
    }

    private parseField(modelName?: string): Field {
        const name = this.expect('IDENTIFIER').value;
        const isOptional = this.peek().type === 'QUESTION';
        if (isOptional) this.advance();

        this.expect('COLON');

        const { type, isArray, enumValues, isCustomType } = this.parseType();
        const constraints = this.parseConstraints();

        this.expect('SEMICOLON');

        return {
            name,
            type: isCustomType ? 'object' : type,
            isArray,
            isOptional,
            constraints,
            enumValues,
            itemType: isArray ? type : undefined,
            customTypeName: isCustomType ? type : undefined
        };
    }

    private parseModel(): Model {
        this.expect('MODEL');
        const name = this.expect('IDENTIFIER').value;
        this.expect('LBRACE');

        const fields: Field[] = [];

        while (this.peek().type !== 'RBRACE') {
            fields.push(this.parseField(name));
        }

        this.expect('RBRACE');

        return { name, fields };
    }

    parse(): Model[] {
        const models: Model[] = [];

        while (this.peek().type !== 'EOF') {
            models.push(this.parseModel());
        }

        return models;
    }
}

// ============================================
// КОНВЕРТЕР В ИСХОДНЫЙ ФОРМАТ
// ============================================

function modelsToSchema(models: Model[]): Record<string, any> {
    const modelMap = new Map<string, Model>();

    // Создаем карту моделей для быстрого поиска
    for (const model of models) {
        modelMap.set(model.name, model);
    }

    // Рекурсивная функция для разворачивания кастомных типов
    function expandField(field: Field): any {
        const fieldDef: any = {
            type: field.isArray ? 'array' : field.type
        };

        // Добавляем required только если поле обязательное
        if (!field.isOptional) {
            fieldDef.required = true;
        }

        if (field.isArray && field.itemType) {
            if (field.customTypeName) {
                // Это массив кастомных объектов
                const referencedModel = modelMap.get(field.customTypeName);
                if (referencedModel) {
                    fieldDef.itemType = {
                        type: 'object',
                        fields: convertModelFields(referencedModel.fields)
                    };
                } else {
                    fieldDef.itemType = { type: field.itemType };
                }
            } else {
                fieldDef.itemType = { type: field.itemType };
            }
        } else if (field.customTypeName) {
            // Это кастомный объект (не массив)
            const referencedModel = modelMap.get(field.customTypeName);
            if (referencedModel) {
                fieldDef.type = 'object';
                fieldDef.fields = convertModelFields(referencedModel.fields);
            }
        }

        if (field.enumValues) {
            fieldDef.enum = field.enumValues;
        }

        for (const constraint of field.constraints) {
            if (constraint.type === 'min') {
                fieldDef.min = constraint.value;
            } else if (constraint.type === 'max') {
                fieldDef.max = constraint.value;
            }
        }

        return fieldDef;
    }

    function convertModelFields(fields: Field[]): Record<string, any> {
        const result: Record<string, any> = {};
        for (const field of fields) {
            result[field.name] = expandField(field);
        }
        return result;
    }

    // Возвращаем только последнюю модель (обычно это основная модель, например User)
    if (models.length > 0) {
        const mainModel = models[models.length - 1];
        return convertModelFields(mainModel.fields);
    }

    return {};
}

// ============================================
// ПРИМЕР ИСПОЛЬЗОВАНИЯ
// ============================================

const dsl = `
model Address {
  street: string;
  city: string;
  zipCode?: string @min(5) @max(10);
}

model IdName {
  id: number;
  name: string;
}

model User {
  id: uuid;
  name: string @min(3) @max(30);
  email: email;
  age?: number @min(18) @max(80);
  isActive: boolean;
  role: "admin" | "user" | "moderator";
  createdAt: date;
  tags: Address[] @min(5) @max(5);
  address: Address;
  metadata?: IdName;
}
`;


try {
    const lexer = new Lexer(dsl);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const models = parser.parse();

    const userSchema = modelsToSchema(models);

    console.log('Parsed models:', JSON.stringify(models, null, 2));
    console.log('\nConverted to schema:', JSON.stringify(userSchema, null, 2));

    // Генерация фейковых данных
    console.log("=== Генерация одного объекта ===");
    const user = DTOGenerator.generate(userSchema);
    console.log(JSON.stringify(user, null, 2));

    console.log("\n=== Генерация массива объектов ===");
    const users = DTOGenerator.generateMany(userSchema, 3);
    console.log(JSON.stringify(users, null, 2));

// Генерация TypeScript типов
    console.log("\n=== TypeScript Interface ===");
    const userInterface = TypeScriptParser.generateInterface("User", userSchema);
    console.log(userInterface);

    console.log("\n=== TypeScript Type ===");
    const userType = TypeScriptParser.generateType("UserType", userSchema);
    console.log(userType);
} catch (error) {
    console.error('Parse error:', error);
}