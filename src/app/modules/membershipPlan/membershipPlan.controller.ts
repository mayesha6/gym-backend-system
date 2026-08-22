import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { MembershipPlanServices } from "./membershipPlan.services";

const createPlan = catchAsync(async (req: Request, res: Response) => {
  const result = await MembershipPlanServices.createPlan(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Membership plan created successfully",
    data: result,
  });
});

const getAllPlans = catchAsync(async (req: Request, res: Response) => {
  const result = await MembershipPlanServices.getAllPlans();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Membership plans fetched successfully",
    data: result,
  });
});

const getSinglePlan = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await MembershipPlanServices.getSinglePlan(id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Membership plan fetched successfully",
    data: result,
  });
});

const updatePlan = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await MembershipPlanServices.updatePlan(id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Membership plan updated successfully",
    data: result,
  });
});

const deletePlan = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await MembershipPlanServices.deletePlan(id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Membership plan deleted successfully",
    data: result,
  });
});

export const MembershipPlanControllers = {
  createPlan,
  getAllPlans,
  getSinglePlan,
  updatePlan,
  deletePlan,
};
