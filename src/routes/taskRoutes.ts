import { Router } from "express";
import { TaskController } from "../controllers/TaskController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateResource";
import { createTaskSchema, updateTaskSchema, } from "../validators/zodSchemas";

const router = Router();

router.use(authMiddleware);

router.get("/", TaskController.getTasks);


router.get("/loggerlist", TaskController.loggerList);


router.post("/", validate(createTaskSchema), TaskController.createTask);

router.get("/:id", TaskController.getTask);
router.put("/:id", validate(updateTaskSchema), TaskController.updateTask);
router.delete("/:id", TaskController.deleteTask);

router.post("/logger",  TaskController.loggerUpdate);




export default router;
