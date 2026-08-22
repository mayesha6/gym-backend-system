import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { BookingControllers } from "./booking.controller";
import { enrollClassZodSchema } from "./booking.validation";

const router = Router();

router.post(
  "/enroll",
  checkAuth(...Object.values(Role)),
  validateRequest(enrollClassZodSchema),
  BookingControllers.enrollInClass
);

router.post(
  "/unenroll/:classId",
  checkAuth(...Object.values(Role)),
  BookingControllers.unenrollFromClass
);

router.get(
  "/whos-going/:classId",
  checkAuth(...Object.values(Role)),
  BookingControllers.getWhosGoing
);

router.get(
  "/roster/:classId",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.COACH),
  BookingControllers.getClassRoster
);

export const BookingRoutes = router;
