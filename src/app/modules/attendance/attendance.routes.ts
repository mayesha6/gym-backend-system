import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { AttendanceControllers } from "./attendance.controller";
import { AttendanceValidations } from "./attendance.validation";

const router = Router();

// Member and Coach can scan QR code to check-in
router.post(
  "/check-in",
  checkAuth(Role.MEMBER, Role.COACH, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(AttendanceValidations.markAttendanceSchema),
  AttendanceControllers.markAttendance
);

// Member/Coach can view their own attendance history
router.get(
  "/my-history",
  checkAuth(Role.MEMBER, Role.COACH, Role.ADMIN, Role.SUPER_ADMIN),
  AttendanceControllers.getMyHistory
);

// Admin can view daily attendance logs
router.get(
  "/daily-logs",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  AttendanceControllers.getDailyLogs
);

export const AttendanceRoutes = router;
