import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { GymdeskServices } from "./gymdesk.services";

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await GymdeskServices.processWebhook(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: result.success,
    message: result.message,
    data: result
  });
});

const getCheckoutUrl = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.userId;
  const { planId } = req.query;

  const result = await GymdeskServices.getCheckoutUrl(
    userId,
    planId as string | undefined
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Checkout URL generated successfully",
    data: result
  });
});

export const GymdeskController = {
  handleWebhook,
  getCheckoutUrl
};
