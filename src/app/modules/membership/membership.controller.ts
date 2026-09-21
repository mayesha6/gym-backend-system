import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { MembershipServices } from "./membership.services";

const getMyMembership = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.user as JwtPayload;
  const childId = (req.query.childId as string) || (req.body?.childId as string);
  const result = await MembershipServices.getMyMembership(userToken.userId, childId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "My membership details fetched successfully",
    data: result,
  });
});

const requestPlanChange = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.user as JwtPayload;
  const { targetPlanId, childId } = req.body;
  const result = await MembershipServices.requestPlanChange(userToken.userId, targetPlanId, childId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: result,
  });
});

const requestCancellation = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.user as JwtPayload;
  const childId = (req.query.childId as string) || (req.body?.childId as string);
  const result = await MembershipServices.requestCancellation(userToken.userId, childId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: result,
  });
});

export const MembershipControllers = {
  getMyMembership,
  requestPlanChange,
  requestCancellation,
};
