import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Task, TaskStatus } from "../entities/Task";
import { TaskDependency } from "../entities/TaskDependency";
import { DependencyGraph } from "../utils/dependencyGraph";
import { AuthRequest } from "../middlewares/authMiddleware";
import { In, LessThan } from "typeorm";
import { Loggers } from "../entities/Loggers";

export class TaskController {
    static async getTasks(req: AuthRequest, res: Response) {
        const userId = req.user!.id;
        const taskRepository = AppDataSource.getRepository(Task);

        // Update overdue status dynamically
        const now = new Date();
        await taskRepository.update(
            {
                userId,
                status: In([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
                due_date: LessThan(now),
                is_overdue: false
            },
            { is_overdue: true }
        );

        // Fetch tasks
        const tasks = await taskRepository.find({
            where: { userId },
            relations: ["dependencies", "dependencies.dependency"]
        });

        return res.json(tasks);
    }

    static async getTask(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const userId = req.user!.id;
        const taskRepository = AppDataSource.getRepository(Task);

        try {
            const task = await taskRepository.findOne({
                where: { id: parseInt(id), userId },
                relations: ["dependencies", "dependencies.dependency"]
            });

            if (!task) {
                return res.status(404).json({ message: "Task not found" });
            }

            return res.json(task);
        } catch (error) {
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async createTask(req: AuthRequest, res: Response) {

        const { title, description, due_date, priority, dependencyIds } = req.body;
        const userId = req.user!.id;
        const taskRepository = AppDataSource.getRepository(Task);
        const dependencyRepository = AppDataSource.getRepository(TaskDependency);

        try {
            const task = taskRepository.create({
                title,
                description,
                due_date,
                priority,
                userId,
                status: TaskStatus.PENDING
            });
            await taskRepository.save(task);

            if (dependencyIds && dependencyIds.length > 0) {
                for (const depId of dependencyIds) {
                    // Check for self-dependency
                    if (depId === task.id) {
                        return res.status(400).json({ message: "Cannot depend on self" });
                    }

                    // Check for cycles (though new task has no dependents yet, so only direct check needed? 
                    // Wait, if I add A->B, and B->A. 
                    // Here I am creating A. It can depend on B. B already exists.
                    // Cycle is possible if B depends on A. But A is just created, so B cannot depend on A yet.
                    // So cycle check is only needed if updating dependencies.
                    // However, for completeness/safety:
                    const hasCycle = await DependencyGraph.hasCycle(task.id, depId, dependencyRepository);
                    if (hasCycle) {
                        return res.status(400).json({ message: `Dependency cycle detected with task ${depId}` });
                    }

                    const dependency = dependencyRepository.create({
                        taskId: task.id,
                        dependencyId: depId
                    });
                    await dependencyRepository.save(dependency);
                }
            }

            // Refetch to get relations
            const createdTask = await taskRepository.findOne({
                where: { id: task.id },
                relations: ["dependencies", "dependencies.dependency"]
            });

            return res.status(201).json(createdTask);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async updateTask(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const { title, description, status, due_date, priority, dependencyIds } = req.body;
        const userId = req.user!.id;
        const taskRepository = AppDataSource.getRepository(Task);
        const dependencyRepository = AppDataSource.getRepository(TaskDependency);
        const loggerRepository = AppDataSource.getRepository(Loggers);

        try {
            const task = await taskRepository.findOne({ where: { id: parseInt(id), userId } });
            if (!task) {
                return res.status(404).json({ message: "Task not found" });
            }

            // Capture previous state for logging
            const prevStatus = task.status;
            const prevPriority = task.priority;
            let hasChanges = false;

            if (status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
                const incompleteIds = await DependencyGraph.getIncompleteDependencies(task.id, dependencyRepository, taskRepository);
                if (incompleteIds.length > 0) {
                    return res.status(400).json({
                        message: "Cannot complete task — dependencies incomplete",
                        incompleteDependencies: incompleteIds
                    });
                }
            }

            // Update fields
            if (title) task.title = title;
            if (description) task.description = description;

            if (status && status !== prevStatus) {
                task.status = status;
                hasChanges = true;
            }

            if (due_date) task.due_date = due_date;

            if (priority && priority !== prevPriority) {
                task.priority = priority;
                hasChanges = true;
            }

            await taskRepository.save(task);

            // Log changes if status or priority changed
            if (hasChanges) {
                const logEntry = loggerRepository.create({
                    date: new Date(),
                    userId,
                    taskId: task.id,
                    status: task.status,
                    prevStatus: prevStatus,
                    priority: task.priority,
                    prevPriority: prevPriority
                });
                await loggerRepository.save(logEntry);
            }

            // Update dependencies if provided
            if (dependencyIds) {
                // Remove existing
                await dependencyRepository.delete({ taskId: task.id });

                // Add new
                for (const depId of dependencyIds) {
                    if (depId === task.id) {
                        return res.status(400).json({ message: "Cannot depend on self" });
                    }

                    const hasCycle = await DependencyGraph.hasCycle(task.id, depId, dependencyRepository);
                    if (hasCycle) {
                        return res.status(400).json({ message: `Dependency cycle detected with task ${depId}` });
                    }

                    const dependency = dependencyRepository.create({
                        taskId: task.id,
                        dependencyId: depId
                    });
                    await dependencyRepository.save(dependency);
                }
            }

            const updatedTask = await taskRepository.findOne({
                where: { id: task.id },
                relations: ["dependencies", "dependencies.dependency"]
            });

            return res.json(updatedTask);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async deleteTask(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const userId = req.user!.id;
        const taskRepository = AppDataSource.getRepository(Task);

        try {
            const task = await taskRepository.findOne({ where: { id: parseInt(id), userId } });
            if (!task) {
                return res.status(404).json({ message: "Task not found" });
            }

            await taskRepository.remove(task);
            return res.status(204).send();
        } catch (error) {
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async loggerUpdate(req: any, res: any) {
        const { date, status, priority, taskId, prevStatus, prevPriority } = req.body;
        const userId = req.user!.id;
        const loggerRepository = AppDataSource.getRepository(Loggers);

        try {
            const task = loggerRepository.create({
                date,
                priority,
                userId,
                status: status,
                prevStatus: prevStatus,
                prevPriority: prevPriority,
                taskId
            });
            await loggerRepository.save(task);
            return res.status(201).json(task);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async loggerList(req: any, res: any) {
        console.log("fhbvhessssfbv1111h");

        try {
            const userId = req.user!.id;
            console.log("fhbvhefbvh", userId);

            const loggerRepository = AppDataSource.getRepository(Loggers);

            // Fetch tasks
            const loggers = await loggerRepository.find({
                where: { userId },
                relations: ["task"],
                order: { date: "DESC" }
            });

            return res.json(loggers);
        } catch (error: any) {
            // console.error(error.message);
            return res.status(500).json({ message: "Internal server error", error });
        }
    }

}



// {
//     "date": "2025-11-24T02:58:13.000Z",
//     "status": "completed",
//     "priority": "low",
//     "userId": 1,
//     "taskId": "7",
//     "createdAt": "2025-11-26T08:10:37.549Z",
//     "updatedAt": "2025-11-26T08:10:37.549Z",
//     "id": 2
// }