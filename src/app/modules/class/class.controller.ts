import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ClassServices } from "./class.services";

import { Role } from "../user/user.interface";

const createClass = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  if (user && user.role === Role.COACH && !req.body.coachId) {
    req.body.coachId = user.userId;
  }
  const result = await ClassServices.createClass(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Class session created successfully",
    data: result,
  });
});

const getWeeklySchedule = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const userId = (req.user as any)?.userId ? String((req.user as any).userId) : undefined;
  const result = await ClassServices.getWeeklySchedule(
    startDate as string,
    endDate as string,
    userId
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Weekly class schedule fetched successfully",
    data: result,
  });
});

const getSingleClass = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req.user as any)?.userId ? String((req.user as any).userId) : undefined;
  const result = await ClassServices.getSingleClass(id, userId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Class details fetched successfully",
    data: result,
  });
});

const updateClass = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ClassServices.updateClass(id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Class session updated successfully",
    data: result,
  });
});

const deleteClass = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ClassServices.deleteClass(id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Class session deleted successfully",
    data: result,
  });
});

const getMyClasses = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const coachId = String((req.user as any)?.userId);
  const result = await ClassServices.getMyClasses(
    coachId,
    startDate as string,
    endDate as string
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Coach class schedule fetched successfully",
    data: result,
  });
});

export const ClassControllers = {
  createClass,
  getWeeklySchedule,
  getMyClasses,
  getSingleClass,
  updateClass,
  deleteClass,
};
