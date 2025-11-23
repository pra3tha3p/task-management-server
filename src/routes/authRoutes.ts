import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { validate } from "../middlewares/validateResource";
import { signupSchema, loginSchema } from "../validators/zodSchemas";

const router = Router();

router.post("/signup", validate(signupSchema), AuthController.signup);

router.post("/login", validate(loginSchema), AuthController.login);

export default router;
