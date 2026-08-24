import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { QRCodeControllers } from "./qrCode.controller";

const router = Router();

// Admin can retrieve today's QR code to display on reception screen
router.get(
  "/today",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  QRCodeControllers.getTodayQRCode
);

export const QRCodeRoutes = router;
