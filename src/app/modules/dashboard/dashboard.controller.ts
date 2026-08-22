import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { DashboardServices } from "./dashboard.services";

const getAdminMetrics = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardServices.getAdminMetrics();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Admin dashboard metrics fetched successfully",
    data: result,
  });
});

export const DashboardControllers = {
  getAdminMetrics,
};
