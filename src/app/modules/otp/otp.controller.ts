import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { OTPService } from "./otp.service";
import httpStatus from 'http-status-codes';

const verifySignupOtp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;

    const user = await OTPService.verifySignupOtp(email, otp);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "OTP verified successfully",
      data: {
        id: user._id,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  }
);

const resendOtp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const result = await OTPService.resendOtp(email);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: result.message,
      data: null,
    });
  }
);

const verifyResetOtp = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  await OTPService.verifyResetOtp(email, otp);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: null,
  });
});

const resendForgotPasswordOtp = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const result = await OTPService.resendForgotPasswordOtp(email);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: result.message,
      data: null,
    });
  }
);

export const OTPController = {
  verifySignupOtp,
  resendOtp,
  verifyResetOtp,
  resendForgotPasswordOtp
};
