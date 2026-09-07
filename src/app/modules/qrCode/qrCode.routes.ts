import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { QRCodeControllers } from "./qrCode.controller";

const router = Router();

// Logged in User (Member, Coach, Admin) can get their own personal QR code
router.get(
  "/my-qr",
  checkAuth(Role.MEMBER, Role.COACH, Role.ADMIN, Role.SUPER_ADMIN),
  QRCodeControllers.getMyQRCode
);

// Admin can retrieve today's QR code to display on reception screen
router.get(
  "/today",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  QRCodeControllers.getTodayQRCode
);

// Admin can force-regenerate a brand new QR code for today
router.post(
  "/regenerate",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  QRCodeControllers.regenerateTodayQRCode
);

export const QRCodeRoutes = router;

