"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskSchema = exports.createTaskSchema = exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
exports.signupSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Name is required"),
        email: zod_1.z.string().email("Invalid email address"),
        password: zod_1.z.string().min(6, "Password must be at least 6 characters long"),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email("Invalid email address"),
        password: zod_1.z.string().min(1, "Password is required"),
    }),
});
exports.createTaskSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, "Title is required"),
        description: zod_1.z.string().optional(),
        due_date: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
            message: "Invalid due date format",
        }),
        priority: zod_1.z.enum(["low", "medium", "high"]).optional(),
        dependencyIds: zod_1.z.array(zod_1.z.number()).optional(),
    }),
});
exports.updateTaskSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, "Invalid task ID"),
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, "Title cannot be empty").optional(),
        description: zod_1.z.string().optional(),
        status: zod_1.z.enum(["pending", "in_progress", "completed"]).optional(),
        due_date: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
            message: "Invalid due date format",
        }).optional(),
        priority: zod_1.z.enum(["low", "medium", "high"]).optional(),
        dependencyIds: zod_1.z.array(zod_1.z.number()).optional(),
    }),
});
