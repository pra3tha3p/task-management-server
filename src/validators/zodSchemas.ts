import { z } from "zod";

export const signupSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters long"),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
    }),
});

export const createTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        due_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
            message: "Invalid due date format",
        }),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dependencyIds: z.array(z.number()).optional(),
    }),
});

export const updateTaskSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, "Invalid task ID"),
    }),
    body: z.object({
        title: z.string().min(1, "Title cannot be empty").optional(),
        description: z.string().optional(),
        status: z.enum(["pending", "in_progress", "completed"]).optional(),
        due_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
            message: "Invalid due date format",
        }).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dependencyIds: z.array(z.number()).optional(),
    }),
});
