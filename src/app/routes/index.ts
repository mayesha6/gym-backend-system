import { Router } from "express";
import { UserRoutes } from "../modules/user/user.routes";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { OtpRoutes } from "../modules/otp/otp.routes";
import { MembershipPlanRoutes } from "../modules/membershipPlan/membershipPlan.routes";
import { MembershipRoutes } from "../modules/membership/membership.routes";
import { CategoryRoutes } from "../modules/category/category.routes";
import { ClassRoutes } from "../modules/class/class.routes";
import { BookingRoutes } from "../modules/booking/booking.routes";
import { DashboardRoutes } from "../modules/dashboard/dashboard.routes";
import { SettingRoutes } from "../modules/setting/setting.routes";

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
  {
    path: "/membership",
    route: MembershipRoutes,
  },
  {
    path: "/category",
    route: CategoryRoutes,
  },
  {
    path: "/class",
    route: ClassRoutes,
  },
  {
    path: "/booking",
    route: BookingRoutes,
  },
  {
    path: "/dashboard",
    route: DashboardRoutes,
  },
  {
    path: "/setting",
    route: SettingRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
