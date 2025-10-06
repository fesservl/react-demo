import { TypeScriptParser } from "./TypeScriptParser.ts";
import { DTOGenerator } from "./DTOGenerator.ts";
import type { Schema } from "./types.ts";

const userSchema: Schema = {
    id: { type: "uuid", required: true },
    name: { type: "string", min: 3, max: 30, required: true },
    email: { type: "email", required: true },
    age: { type: "number", min: 18, max: 80 },
    isActive: { type: "boolean", required: true },
    role: { type: "string", enum: ["admin", "user", "moderator"], required: true },
    createdAt: { type: "date", required: true },
    tags: {
        type: "array",
        itemType: {
            type: "object",
            fields: {
                street: { type: "string", required: true },
                city: { type: "string", required: true },
                zipCode: { type: "string", min: 5, max: 10 },
            },
        },
        min: 5,
        max: 5,
    },
    address: {
        type: "object",
        fields: {
            street: { type: "string", required: true },
            city: { type: "string", required: true },
            zipCode: { type: "string", min: 5, max: 10 },
        },
    },
    metadata: { type: "object", required: false },
};

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
