import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, BeforeInsert, BeforeUpdate } from "typeorm";
import { User } from "./User";
import { Task } from "./Task";

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
export class Loggers {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "datetime" })
    date!: Date;

    @Column({
        type: "enum",
        enum: TaskStatus,
        default: TaskStatus.PENDING
    })
    status!: TaskStatus;

    @Column({
        type: "enum",
        enum: TaskStatus,
        default: TaskStatus.PENDING
    })
    prevStatus!: TaskStatus;

    @Column({
        type: "enum",
        enum: TaskPriority,
        default: TaskPriority.MEDIUM
    })
    prevPriority!: TaskPriority;

    @Column({
        type: "enum",
        enum: TaskPriority,
        default: TaskPriority.MEDIUM
    })
    priority!: TaskPriority;


    @ManyToOne(() => User, (user) => user.loggers)
    user!: User;

    @Column()
    userId!: number;

    @ManyToOne(() => Task)
    task!: Task;

    @Column()
    taskId!: number;

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
