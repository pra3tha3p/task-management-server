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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const data_source_1 = require("../config/data-source");
const User_1 = require("../entities/User");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthController {
    static signup(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, email, password } = req.body;
            const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
            try {
                const existingUser = yield userRepository.findOneBy({ email });
                if (existingUser) {
                    return res.status(400).json({ message: "User already exists" });
                }
                const passwordHash = yield bcrypt_1.default.hash(password, 10);
                const user = userRepository.create({ name, email, passwordHash });
                yield userRepository.save(user);
                const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "supersecretkey", { expiresIn: "1h" });
                return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
            }
            catch (error) {
                return res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    static login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password } = req.body;
            const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
            try {
                const user = yield userRepository.findOneBy({ email });
                if (!user) {
                    return res.status(400).json({ message: "Invalid credentials" });
                }
                const isPasswordValid = yield bcrypt_1.default.compare(password, user.passwordHash);
                if (!isPasswordValid) {
                    return res.status(400).json({ message: "Invalid credentials" });
                }
                const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "supersecretkey", { expiresIn: "1h" });
                return res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email } });
            }
            catch (error) {
                return res.status(500).json({ message: "Internal server error" });
            }
        });
    }
}
exports.AuthController = AuthController;
