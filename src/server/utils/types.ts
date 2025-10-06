// Определение схемы
export interface FieldSchema {
    type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'uuid' | 'array' | 'object';
    itemType?: FieldSchema; // Для массивов
    fields?: Record<string, FieldSchema>; // Для вложенных объектов
    min?: number; // Минимальное значение для чисел или длины строки
    max?: number; // Максимальное значение для чисел или длины строки
    enum?: any[]; // Для перечислений
    required?: boolean; // Обязательное ли поле
}

export interface Schema {
    [key: string]: FieldSchema;
}