import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateToken } from "../middlewares/authMiddleware";

export class AuthController {
    static async signup(req: Request, res: Response) {

        const { name, email, password } = req.body;
        const userRepository = AppDataSource.getRepository(User);

        try {
            const existingUser = await userRepository.findOneBy({ email });
            if (existingUser) {
                return res.status(400).json({ message: "User already exists" });
            }

            const passwordHash = await bcrypt.hash(password, 10);
            const user = userRepository.create({ name, email, passwordHash });
            await userRepository.save(user);

            const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "supersecretkey", { expiresIn: "1h" });

            return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
        } catch (error) {
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async login(req: Request, res: Response) {

        const { email, password } = req.body;
        const userRepository = AppDataSource.getRepository(User);

        try {
            const user = await userRepository.findOneBy({ email });
            if (!user) {
                return res.status(400).json({ message: "Invalid credentials" });
            }

            const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
            if (!isPasswordValid) {
                return res.status(400).json({ message: "Invalid credentials" });
            }

            const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "supersecretkey", { expiresIn: "1h" });

            return res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email } });
        } catch (error) {
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}
