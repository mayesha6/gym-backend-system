import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserControllers } from "./user.controller";
import { Role } from "./user.interface";
import { addChildZodSchema, addMemberZodSchema, updateChildZodSchema, updateUserZodSchema } from "./user.validation";
import { parseFormDataMiddleware } from "../../middlewares/parseFormDataMiddleware";
import { FileTypes, upload } from "../../config/S3Client.config";

const router = Router();

router.post(
  "/add-user",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(addMemberZodSchema),
  UserControllers.addMember
);

router.get(
  "/all-users",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.COACH),
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
  UserControllers.updateMyProfile
);

router.patch(
  "/device-token",
  checkAuth(...Object.values(Role)),
  UserControllers.updateWebPushToken
);

router.post(
  "/add-child",
  checkAuth(Role.PARENT, Role.SUPER_ADMIN, Role.ADMIN, Role.USER),
  validateRequest(addChildZodSchema),
  UserControllers.addChild
);

router.get(
  "/my-children",
  checkAuth(Role.PARENT, Role.SUPER_ADMIN, Role.ADMIN, Role.USER),
  UserControllers.getMyChildren
);

router.patch(
  "/child/:childId",
  checkAuth(Role.PARENT, Role.SUPER_ADMIN, Role.ADMIN, Role.USER),
  upload({
    folder: "UserImage",
    fileType: FileTypes.IMAGE,
    maxCount: 1,
  }),
  parseFormDataMiddleware,
  validateRequest(updateChildZodSchema),
  UserControllers.updateChild
);

router.delete(
  "/child/:childId",
  checkAuth(Role.PARENT, Role.SUPER_ADMIN, Role.ADMIN, Role.USER),
  UserControllers.deleteChild
);

router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.COACH, Role.MEMBER),
  UserControllers.getSingleUser
);

router.patch(
  "/:id",
  validateRequest(updateUserZodSchema),
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.updateUser
);

router.delete(
  "/delete-own-account",
  checkAuth(...Object.values(Role)),
  UserControllers.deleteOwnAccount
);

router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.deleteUserById
);

router.delete(
  "/",
  checkAuth(Role.SUPER_ADMIN),
  UserControllers.deleteAllUsers
);

export const UserRoutes = router;
