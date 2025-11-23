"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskController = void 0;
const data_source_1 = require("../config/data-source");
const Task_1 = require("../entities/Task");
const TaskDependency_1 = require("../entities/TaskDependency");
const dependencyGraph_1 = require("../utils/dependencyGraph");
const typeorm_1 = require("typeorm");
class TaskController {
    static getTasks(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const taskRepository = data_source_1.AppDataSource.getRepository(Task_1.Task);
            // Update overdue status dynamically
            const now = new Date();
            yield taskRepository.update({
                userId,
                status: (0, typeorm_1.In)([Task_1.TaskStatus.PENDING, Task_1.TaskStatus.IN_PROGRESS]),
                due_date: (0, typeorm_1.LessThan)(now),
                is_overdue: false
            }, { is_overdue: true });
            // Fetch tasks
            const tasks = yield taskRepository.find({
                where: { userId },
                relations: ["dependencies", "dependencies.dependency"]
            });
            return res.json(tasks);
        });
    }
    static getTask(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const userId = req.user.id;
            const taskRepository = data_source_1.AppDataSource.getRepository(Task_1.Task);
            try {
                const task = yield taskRepository.findOne({
                    where: { id: parseInt(id), userId },
                    relations: ["dependencies", "dependencies.dependency"]
                });
                if (!task) {
                    return res.status(404).json({ message: "Task not found" });
                }
                return res.json(task);
            }
            catch (error) {
                return res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    static createTask(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { title, description, due_date, priority, dependencyIds } = req.body;
            const userId = req.user.id;
            const taskRepository = data_source_1.AppDataSource.getRepository(Task_1.Task);
            const dependencyRepository = data_source_1.AppDataSource.getRepository(TaskDependency_1.TaskDependency);
            try {
                const task = taskRepository.create({
                    title,
                    description,
                    due_date,
                    priority,
                    userId,
                    status: Task_1.TaskStatus.PENDING
                });
                yield taskRepository.save(task);
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
                        const hasCycle = yield dependencyGraph_1.DependencyGraph.hasCycle(task.id, depId, dependencyRepository);
                        if (hasCycle) {
                            return res.status(400).json({ message: `Dependency cycle detected with task ${depId}` });
                        }
                        const dependency = dependencyRepository.create({
                            taskId: task.id,
                            dependencyId: depId
                        });
                        yield dependencyRepository.save(dependency);
                    }
                }
                // Refetch to get relations
                const createdTask = yield taskRepository.findOne({
                    where: { id: task.id },
                    relations: ["dependencies", "dependencies.dependency"]
                });
                return res.status(201).json(createdTask);
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    static updateTask(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { title, description, status, due_date, priority, dependencyIds } = req.body;
            const userId = req.user.id;
            const taskRepository = data_source_1.AppDataSource.getRepository(Task_1.Task);
            const dependencyRepository = data_source_1.AppDataSource.getRepository(TaskDependency_1.TaskDependency);
            try {
                const task = yield taskRepository.findOne({ where: { id: parseInt(id), userId } });
                if (!task) {
                    return res.status(404).json({ message: "Task not found" });
                }
                if (status === Task_1.TaskStatus.COMPLETED && task.status !== Task_1.TaskStatus.COMPLETED) {
                    const incompleteIds = yield dependencyGraph_1.DependencyGraph.getIncompleteDependencies(task.id, dependencyRepository, taskRepository);
                    if (incompleteIds.length > 0) {
                        return res.status(400).json({
                            message: "Cannot complete task — dependencies incomplete",
                            incompleteDependencies: incompleteIds
                        });
                    }
                }
                // Update fields
                if (title)
                    task.title = title;
                if (description)
                    task.description = description;
                if (status)
                    task.status = status;
                if (due_date)
                    task.due_date = due_date;
                if (priority)
                    task.priority = priority;
                yield taskRepository.save(task);
                // Update dependencies if provided
                if (dependencyIds) {
                    // Remove existing
                    yield dependencyRepository.delete({ taskId: task.id });
                    // Add new
                    for (const depId of dependencyIds) {
                        if (depId === task.id) {
                            return res.status(400).json({ message: "Cannot depend on self" });
                        }
                        const hasCycle = yield dependencyGraph_1.DependencyGraph.hasCycle(task.id, depId, dependencyRepository);
                        if (hasCycle) {
                            return res.status(400).json({ message: `Dependency cycle detected with task ${depId}` });
                        }
                        const dependency = dependencyRepository.create({
                            taskId: task.id,
                            dependencyId: depId
                        });
                        yield dependencyRepository.save(dependency);
                    }
                }
                const updatedTask = yield taskRepository.findOne({
                    where: { id: task.id },
                    relations: ["dependencies", "dependencies.dependency"]
                });
                return res.json(updatedTask);
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    static deleteTask(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const userId = req.user.id;
            const taskRepository = data_source_1.AppDataSource.getRepository(Task_1.Task);
            try {
                const task = yield taskRepository.findOne({ where: { id: parseInt(id), userId } });
                if (!task) {
                    return res.status(404).json({ message: "Task not found" });
                }
                yield taskRepository.remove(task);
                return res.status(204).send();
            }
            catch (error) {
                return res.status(500).json({ message: "Internal server error" });
            }
        });
    }
}
exports.TaskController = TaskController;
