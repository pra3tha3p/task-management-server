# Task Management System

A complete Task Management System with authentication, task CRUD, strict dependency rules, and overdue task handling. Built with Node.js (Express + TypeORM + MySQL).

## Tech Stack
**Backend:**
- Node.js + Express
- TypeORM (ORM)
- MySQL (Database)
- JWT (Authentication)
- Express Validator (Validation)

## Setup & Installation

### Prerequisites
- Node.js (v14+)
- MySQL Server

### Database Setup
1. Start your MySQL server.
2. Create a database named `task_management_db`:
   ```sql
   CREATE DATABASE task_management_db;
   ```
3. (Optional) Update `taskmanagement-server/.env` if your credentials differ from default (`root`/`password`).

### Backend Setup
1. Navigate to the server directory:
   ```bash
   cd taskmanagement-server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:3000`. Tables will be auto-created.
## API Documentation

### Auth
- `POST /auth/signup`: Register a new user.
- `POST /auth/login`: Login and receive JWT.

### Tasks
- `GET /tasks`: Fetch all tasks (updates overdue status dynamically).
- `POST /tasks`: Create a new task.
- `PUT /tasks/:id`: Update a task.
- `DELETE /tasks/:id`: Delete a task.

## Migration
TypeORM `synchronize: true` is enabled for development, so migrations are handled automatically. For production, disable synchronization and use TypeORM CLI to generate migrations.
