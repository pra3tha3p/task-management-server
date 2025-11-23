import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { User } from "../entities/User";
import { TaskDependency } from "../entities/TaskDependency";
import { Task } from "../entities/Task";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "sql12.freesqldatabase.com",
    port: parseInt(process.env.DB_PORT || "3306"),
    username: process.env.DB_USERNAME || "sql12808956",
    password: process.env.DB_PASSWORD || "v8caPskg7d",
    database: process.env.DB_NAME || "sql12808956",
    synchronize: true, // Auto-create tables (dev only)
    logging: false,
    entities: [User, Task, TaskDependency],
    migrations: [],
    subscribers: [],
});
