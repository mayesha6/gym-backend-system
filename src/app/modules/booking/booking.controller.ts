import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { BookingServices } from "./booking.services";

const enrollInClass = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.user as JwtPayload;
  const { classId } = req.body;
  const result = await BookingServices.enrollInClass(userToken.userId, classId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Successfully enrolled in class",
    data: result,
  });
});

const unenrollFromClass = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.user as JwtPayload;
  const { classId } = req.params;
  const result = await BookingServices.unenrollFromClass(userToken.userId, classId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully unenrolled from class",
    data: result,
  });
});

const getWhosGoing = catchAsync(async (req: Request, res: Response) => {
  const { classId } = req.params;
  const result = await BookingServices.getWhosGoing(classId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Who's going member list fetched successfully",
    data: result,
  });
});

const getClassRoster = catchAsync(async (req: Request, res: Response) => {
  const { classId } = req.params;
  const result = await BookingServices.getClassRoster(classId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Class roster fetched successfully",
    data: result,
  });
});

export const BookingControllers = {
  enrollInClass,
  unenrollFromClass,
  getWhosGoing,
  getClassRoster,
};
