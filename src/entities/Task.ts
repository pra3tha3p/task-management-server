import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, BeforeInsert, BeforeUpdate } from "typeorm";
import { User } from "./User";
import { TaskDependency } from "./TaskDependency";

export enum TaskStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed"
}

export enum TaskPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}

@Entity()
export class Task {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column({ type: "text", nullable: true })
    description!: string;

    @Column({
        type: "enum",
        enum: TaskStatus,
        default: TaskStatus.PENDING
    })
    status!: TaskStatus;

    @Column({ type: "datetime" })
    due_date!: Date;

    @Column({
        type: "enum",
        enum: TaskPriority,
        default: TaskPriority.MEDIUM
    })
    priority!: TaskPriority;

    @Column({ default: false })
    is_overdue!: boolean;

    @ManyToOne(() => User, (user) => user.tasks)
    user!: User;

    @Column()
    userId!: number;

    @OneToMany(() => TaskDependency, (dependency) => dependency.task)
    dependencies!: TaskDependency[];

    @OneToMany(() => TaskDependency, (dependency) => dependency.dependency)
    dependents!: TaskDependency[];

    @Column({ type: "datetime" })
    createdAt!: Date;

    @Column({ type: "datetime" })
    updatedAt!: Date;

    @BeforeInsert()
    setDates() {
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    @BeforeUpdate()
    updateDates() {
        this.updatedAt = new Date();
    }
}
