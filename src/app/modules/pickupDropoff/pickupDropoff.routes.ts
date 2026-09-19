import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { PickupDropoffControllers } from "./pickupDropoff.controller";
import { PickupDropoffValidations } from "./pickupDropoff.validation";

const router = Router();

router.post(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.PARENT, Role.MEMBER, Role.USER),
  validateRequest(PickupDropoffValidations.createPickupDropoffZodSchema),
  PickupDropoffControllers.createSchedule
);

router.get(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.COACH, Role.PARENT, Role.MEMBER, Role.USER),
  PickupDropoffControllers.getAllSchedules
);

router.get(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.COACH, Role.PARENT, Role.MEMBER, Role.USER),
  PickupDropoffControllers.getSingleSchedule
);

router.patch(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.PARENT, Role.MEMBER, Role.USER),
  validateRequest(PickupDropoffValidations.updatePickupDropoffZodSchema),
  PickupDropoffControllers.updateSchedule
);

router.patch(
  "/:id/status",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.COACH, Role.PARENT, Role.MEMBER, Role.USER),
  validateRequest(PickupDropoffValidations.updatePickupDropoffStatusZodSchema),
  PickupDropoffControllers.updateStatus
);

router.delete(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.PARENT, Role.MEMBER, Role.USER),
  PickupDropoffControllers.deleteSchedule
);

export const PickupDropoffRoutes = router;
