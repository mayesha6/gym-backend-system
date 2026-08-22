// src/modules/otp/otp.routes.ts
import express from "express";
import { OTPController } from "./otp.controller";

const router = express.Router();


router.post("/verify-signup-otp", OTPController.verifySignupOtp);
router.post("/resend-otp", OTPController.resendOtp);

router.post("/forget-resend-otp", OTPController.resendForgotPasswordOtp);

router.post("/verify-reset-password", OTPController.verifyResetOtp);
export const OtpRoutes = router;
