import { Router } from "express";
import { UserRoutes } from "../modules/user/user.routes";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { OtpRoutes } from "../modules/otp/otp.routes";
import { MembershipPlanRoutes } from "../modules/membershipPlan/membershipPlan.routes";

export const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/otp",
    route: OtpRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/membership-plan",
    route: MembershipPlanRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
