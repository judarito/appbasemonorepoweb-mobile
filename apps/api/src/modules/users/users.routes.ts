import { Hono } from "hono";
import { UsersController } from "./users.controller";

const router = new Hono();
const controller = new UsersController();

router.get("/", controller.getUsers);
router.get("/:id", controller.getUser);
router.post("/", controller.createUser);
router.patch("/:id", controller.updateUser);
router.delete("/:id", controller.deleteUser);

export const usersRoutes = router;
