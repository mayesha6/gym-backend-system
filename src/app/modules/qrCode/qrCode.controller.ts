import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { QRCodeServices } from "./qrCode.services";

const getTodayQRCode = catchAsync(async (req: Request, res: Response) => {
  const result = await QRCodeServices.getOrGenerateTodayQR();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Today's QR Code retrieved successfully",
    data: result,
  });
});

export const QRCodeControllers = {
  getTodayQRCode,
};
