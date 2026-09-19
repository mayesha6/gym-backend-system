import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PickupDropoffServices } from "./pickupDropoff.services";

const createSchedule = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.user as JwtPayload;
  const result = await PickupDropoffServices.createSchedule(userToken.userId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Pickup/Drop-off schedule created successfully",
    data: result,
  });
});

const getAllSchedules = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.user as JwtPayload;
  const result = await PickupDropoffServices.getAllSchedules(
    userToken.userId,
    userToken.role,
    req.query
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Schedules retrieved successfully",
    data: result,
  });
});

const getSingleSchedule = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.user as JwtPayload;
  const { id } = req.params;
  const result = await PickupDropoffServices.getSingleSchedule(
    id,
    userToken.userId,
    userToken.role
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Schedule retrieved successfully",
    data: result,
  });
});

const updateSchedule = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.user as JwtPayload;
  const { id } = req.params;
  const result = await PickupDropoffServices.updateSchedule(
    id,
    userToken.userId,
    userToken.role,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Schedule updated successfully",
    data: result,
  });
});

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.user as JwtPayload;
  const { id } = req.params;
  const { status } = req.body;
  const result = await PickupDropoffServices.updateStatus(
    id,
    userToken.userId,
    userToken.role,
    status
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Schedule status updated successfully",
    data: result,
  });
});

const deleteSchedule = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.user as JwtPayload;
  const { id } = req.params;
  const result = await PickupDropoffServices.deleteSchedule(
    id,
    userToken.userId,
    userToken.role
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Schedule deleted successfully",
    data: result,
  });
});

export const PickupDropoffControllers = {
  createSchedule,
  getAllSchedules,
  getSingleSchedule,
  updateSchedule,
  updateStatus,
  deleteSchedule,
};
