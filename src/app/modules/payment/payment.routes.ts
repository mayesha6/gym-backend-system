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

// Public/Protected route to verify Stripe checkout session after redirect to successUrl
router.get("/verify-session", PaymentControllers.verifySession);

// Protected route to cancel recurring subscription
router.post(
  "/cancel-subscription",
  checkAuth(Role.MEMBER, Role.USER),
  PaymentControllers.cancelSubscription
);

export const PaymentRoutes = router;




// sudo certbot delete --cert-name 206.162.244.175.sslip.io

// # ২. Nginx কনফিগ মুছে রিলোড দেওয়া
// sudo rm /etc/nginx/sites-enabled/temp-ssl /etc/nginx/sites-available/temp-ssl
// sudo systemctl reload nginx