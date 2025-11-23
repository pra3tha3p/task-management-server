import { Repository } from "typeorm";
import { TaskDependency } from "../entities/TaskDependency";

export class DependencyGraph {
    static async hasCycle(taskId: number, newDependencyId: number, dependencyRepository: Repository<TaskDependency>): Promise<boolean> {
        if (taskId === newDependencyId) return true;

        const visited = new Set<number>();
        const stack = [newDependencyId];

        while (stack.length > 0) {
            const currentId = stack.pop()!;
            if (currentId === taskId) return true;

            if (!visited.has(currentId)) {
                visited.add(currentId);
                const dependencies = await dependencyRepository.find({ where: { taskId: currentId } });
                for (const dep of dependencies) {
                    stack.push(dep.dependencyId);
                }
            }
        }

        return false;
    }

    static async getIncompleteDependencies(taskId: number, dependencyRepository: Repository<TaskDependency>, taskRepository: any): Promise<number[]> {
        const dependencies = await dependencyRepository.find({ where: { taskId }, relations: ["dependency"] });
        const incompleteIds: number[] = [];

        for (const dep of dependencies) {
            if (dep.dependency.status !== "completed") {
                incompleteIds.push(dep.dependency.id);
            }
        }

        return incompleteIds;
    }
}
