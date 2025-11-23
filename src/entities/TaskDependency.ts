import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Task } from "./Task";

@Entity()
export class TaskDependency {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    taskId!: number;

    @Column()
    dependencyId!: number;

    @ManyToOne(() => Task, (task) => task.dependencies, { onDelete: "CASCADE" })
    @JoinColumn({ name: "taskId" })
    task!: Task;

    @ManyToOne(() => Task, (task) => task.dependents, { onDelete: "CASCADE" })
    @JoinColumn({ name: "dependencyId" })
    dependency!: Task;
}
