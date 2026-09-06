import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PaymentServices } from "./payment.services";

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.userId;
  const { planId } = req.body;

  const result = await PaymentServices.createSubscriptionCheckoutSession(userId, planId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stripe recurring subscription checkout URL generated successfully",
    data: result,
  });
});

const verifySession = catchAsync(async (req: Request, res: Response) => {
  const sessionId = (req.query.session_id || req.body.sessionId) as string;

  const result = await PaymentServices.verifySession(sessionId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment verified and membership activated successfully",
    data: result,
  });
});

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  const rawBody = req.body;

  const result = await PaymentServices.handleStripeWebhook(rawBody, signature);

  res.status(httpStatus.OK).json(result);
});

const cancelSubscription = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.userId;

  const result = await PaymentServices.cancelSubscription(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

export const PaymentControllers = {
  createCheckoutSession,
  verifySession,
  handleStripeWebhook,
  cancelSubscription,
};
