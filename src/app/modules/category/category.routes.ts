import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { CategoryControllers } from "./category.controller";
import { createCategoryZodSchema, updateCategoryZodSchema } from "./category.validation";

const router = Router();

router.post(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(createCategoryZodSchema),
  CategoryControllers.createCategory
);

router.get("/", CategoryControllers.getAllCategories);

router.patch(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updateCategoryZodSchema),
  CategoryControllers.updateCategory
);

router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  CategoryControllers.deleteCategory
);

export const CategoryRoutes = router;
