import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { MembershipControllers } from "./membership.controller";
import { requestPlanChangeZodSchema } from "./membership.validation";

const router = Router();

router.get(
  "/my-membership",
  checkAuth(...Object.values(Role)),
  MembershipControllers.getMyMembership
);

router.post(
  "/request-change",
  checkAuth(...Object.values(Role)),
  validateRequest(requestPlanChangeZodSchema),
  MembershipControllers.requestPlanChange
);

router.delete(
  "/cancel",
  checkAuth(...Object.values(Role)),
  MembershipControllers.requestCancellation
);

export const MembershipRoutes = router;
