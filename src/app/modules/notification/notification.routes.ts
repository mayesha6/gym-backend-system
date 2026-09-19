import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { NotificationControllers } from "./notification.controller";

const router = Router();

router.get(
  "/my-notifications",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.COACH, Role.MEMBER, Role.PARENT, Role.USER),
  NotificationControllers.getMyNotifications
);

router.patch(
  "/read-all",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.COACH, Role.MEMBER, Role.PARENT, Role.USER),
  NotificationControllers.markAllAsRead
);

router.patch(
  "/:id/read",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.COACH, Role.MEMBER, Role.PARENT, Role.USER),
  NotificationControllers.markAsRead
);

export const NotificationRoutes = router;
