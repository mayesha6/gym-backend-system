import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { PaymentControllers } from "./payment.controller";

const router = Router();

// Protected route to create recurring subscription checkout session
router.post(
  "/checkout-session",
  checkAuth(Role.MEMBER, Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  PaymentControllers.createCheckoutSession
);

// Protected route to cancel recurring subscription
router.post(
  "/cancel-subscription",
  checkAuth(Role.MEMBER, Role.USER),
  PaymentControllers.cancelSubscription
);

export const PaymentRoutes = router;
