import { Router } from "express";
import { checkAuth, optionalAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { ClassControllers } from "./class.controller";
import { createClassZodSchema, updateClassZodSchema } from "./class.validation";

const router = Router();

router.post(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.COACH),
  validateRequest(createClassZodSchema),
  ClassControllers.createClass
);

router.get("/schedule", optionalAuth, ClassControllers.getWeeklySchedule);

router.get("/:id", optionalAuth, ClassControllers.getSingleClass);

router.patch(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.COACH),
  validateRequest(updateClassZodSchema),
  ClassControllers.updateClass
);

router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  ClassControllers.deleteClass
);

export const ClassRoutes = router;
