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
exports.DependencyGraph = void 0;
class DependencyGraph {
    static hasCycle(taskId, newDependencyId, dependencyRepository) {
        return __awaiter(this, void 0, void 0, function* () {
            if (taskId === newDependencyId)
                return true;
            const visited = new Set();
            const stack = [newDependencyId];
            while (stack.length > 0) {
                const currentId = stack.pop();
                if (currentId === taskId)
                    return true;
                if (!visited.has(currentId)) {
                    visited.add(currentId);
                    const dependencies = yield dependencyRepository.find({ where: { taskId: currentId } });
                    for (const dep of dependencies) {
                        stack.push(dep.dependencyId);
                    }
                }
            }
            return false;
        });
    }
    static getIncompleteDependencies(taskId, dependencyRepository, taskRepository) {
        return __awaiter(this, void 0, void 0, function* () {
            const dependencies = yield dependencyRepository.find({ where: { taskId }, relations: ["dependency"] });
            const incompleteIds = [];
            for (const dep of dependencies) {
                if (dep.dependency.status !== "completed") {
                    incompleteIds.push(dep.dependency.id);
                }
            }
            return incompleteIds;
        });
    }
}
exports.DependencyGraph = DependencyGraph;
