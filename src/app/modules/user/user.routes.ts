import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserControllers } from "./user.controller";
import { Role } from "./user.interface";
import { updateUserZodSchema } from "./user.validation";
import { parseFormDataMiddleware } from "../../middlewares/parseFormDataMiddleware";
import { FileTypes, upload } from "../../config/S3Client.config";

const router = Router();

router.post("/register", UserControllers.createUser);
router.post(
  "/create", 
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN),
  UserControllers.createUser
);
router.get(
  "/all-users",
  checkAuth(Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN, Role.SUPER_ADMIN, Role.USER),
  UserControllers.getAllUsers
);
router.get("/me", checkAuth(...Object.values(Role)), UserControllers.getMe);
router.patch(
  "/update-my-profile",
  checkAuth(...Object.values(Role)),
  upload({
    folder: "UserImage",
    fileType: FileTypes.IMAGE,
    maxCount: 1,
  }),
  parseFormDataMiddleware,
  // validateRequest(updateUserZodSchema),
  UserControllers.updateMyProfile
);
router.get(
  "/by-slug/:slug",
  checkAuth(Role.SUPER_ADMIN),
  UserControllers.getUserBySlug
);

router.get(
  "/:id",
  checkAuth(Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN, Role.SUPER_ADMIN, Role.USER),
  UserControllers.getSingleUser
);
router.patch(
  "/:id",
  validateRequest(updateUserZodSchema),
  checkAuth(Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN, Role.SUPER_ADMIN),
  UserControllers.updateUser
);
router.delete(
  "/delete-own-account",
  checkAuth(...Object.values(Role)),
  UserControllers.deleteOwnAccount
);
router.delete(
  "/delete-own-profile",
  checkAuth(...Object.values(Role)),
  UserControllers.deleteOwnAccount
);
router.patch(
  "/approve/:id",
  checkAuth(Role.SUPER_ADMIN),
  UserControllers.approveOrganization
);
router.patch(
  "/reject/:id",
  checkAuth(Role.SUPER_ADMIN),
  UserControllers.rejectOrganization
);

router.delete(
  "/:id",
  checkAuth(Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN,Role.SUPER_ADMIN),
  UserControllers.deleteUserById
);
router.delete(
  "/",
  checkAuth(Role.ORGANIZATION_ADMIN, Role.SUPER_ADMIN),
  UserControllers.deleteAllUsers
);

export const UserRoutes = router;
