import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AttendanceServices } from "./attendance.services";
import { Role } from "../user/user.interface";

const markAttendance = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { token, bookingId } = req.body;

  const result = await AttendanceServices.markAttendanceViaQR(
    user.userId,
    user.role as Role,
    token,
    bookingId
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Attendance marked successfully!",
    data: result,
  });
});

const getMyHistory = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await AttendanceServices.getMyAttendanceHistory(user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Attendance history fetched successfully",
    data: result,
  });
});

const getDailyLogs = catchAsync(async (req: Request, res: Response) => {
  const date = req.query.date as string | undefined;
  const result = await AttendanceServices.getDailyAttendanceLogs(date);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Daily attendance logs retrieved successfully",
    data: result,
  });
});

export const AttendanceControllers = {
  markAttendance,
  getMyHistory,
  getDailyLogs,
};
