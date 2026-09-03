import { Router } from "express";
import { GymdeskController } from "./gymdesk.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = Router();

// Public Webhook route for Gymdesk Automations
router.post("/webhook", GymdeskController.handleWebhook);

// Protected Checkout URL generator route (supports both /checkout-url and /checkout-url/:planId)
router.get(
  "/checkout-url/:planId",
  checkAuth(Role.MEMBER, Role.USER, Role.COACH, Role.ADMIN, Role.SUPER_ADMIN),
  GymdeskController.getCheckoutUrl
);

export const GymdeskRoutes = router;
