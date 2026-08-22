import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { MembershipPlanControllers } from "./membershipPlan.controller";
import { createMembershipPlanZodSchema, updateMembershipPlanZodSchema } from "./membershipPlan.validation";

const router = Router();

router.post(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(createMembershipPlanZodSchema),
  MembershipPlanControllers.createPlan
);

router.get("/", MembershipPlanControllers.getAllPlans);

router.get("/:id", MembershipPlanControllers.getSinglePlan);

router.patch(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updateMembershipPlanZodSchema),
  MembershipPlanControllers.updatePlan
);

router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  MembershipPlanControllers.deletePlan
);

export const MembershipPlanRoutes = router;
