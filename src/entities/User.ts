import { Entity, PrimaryGeneratedColumn, Column, OneToMany, BeforeInsert, BeforeUpdate } from "typeorm";
import { Task } from "./Task";
import { Loggers } from "./Loggers";


@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    passwordHash!: string;

    @OneToMany(() => Task, (task) => task.user)
    tasks!: Task[];

    @OneToMany(() => Loggers, (loggers) => loggers.user)
    loggers!: Loggers[];

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
