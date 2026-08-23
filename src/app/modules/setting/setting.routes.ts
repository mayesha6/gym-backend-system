import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { parseFormDataMiddleware } from "../../middlewares/parseFormDataMiddleware";
import { FileTypes, upload } from "../../config/S3Client.config";
import { Role } from "../user/user.interface";
import { SettingControllers } from "./setting.controller";
import { updateGymdeskConfigZodSchema, updateGymInfoZodSchema } from "./setting.validation";

const router = Router();

router.get("/gym-info", SettingControllers.getGymInfo);

router.patch(
  "/gym-info",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  upload({
    folder: "GymLogo",
    fileType: FileTypes.IMAGE,
    maxCount: 1,
  }),
  parseFormDataMiddleware,
  validateRequest(updateGymInfoZodSchema),
  SettingControllers.updateGymInfo
);

router.patch(
  "/gymdesk-config",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updateGymdeskConfigZodSchema),
  SettingControllers.updateGymdeskConfig
);

router.post(
  "/gymdesk-sync",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  SettingControllers.triggerGymdeskSync
);

export const SettingRoutes = router;

