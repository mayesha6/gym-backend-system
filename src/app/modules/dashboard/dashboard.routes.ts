import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { DashboardControllers } from "./dashboard.controller";

const router = Router();

router.get(
  "/metrics",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DashboardControllers.getAdminMetrics
);

export const DashboardRoutes = router;
