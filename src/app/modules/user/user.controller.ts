/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { UserServices } from "./user.services";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await UserServices.createUser(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User Created Successfully",
    data: user,
  });
});

const addMember = catchAsync(async (req: Request, res: Response) => {
  const creator = req.user as JwtPayload;
  const result = await UserServices.addMember(req.body, creator?.role as Role);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Member created successfully",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.getAllUsers(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Users fetched successfully",
    meta: result.meta,
    data: result.result,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.user as JwtPayload;
  const user = await UserServices.getMe(userToken.userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Current user profile fetched successfully",
    data: user,
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await UserServices.getSingleUser(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User fetched successfully",
    data: user,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await UserServices.updateUser(id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User updated successfully",
    data: user,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.user as JwtPayload;
  const user = await UserServices.updateMyProfile(userToken.userId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Profile updated successfully",
    data: user,
  });
});

const deleteOwnAccount = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.user as JwtPayload;
  const user = await UserServices.deleteOwnAccount(userToken.userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Account deleted successfully",
    data: user,
  });
});

const deleteUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await UserServices.deleteUserById(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User deleted successfully",
    data: user,
  });
});

const deleteAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.deleteAllUsers();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All users deleted successfully",
    data: result,
  });
});

export const UserControllers = {
  createUser,
  addMember,
  getAllUsers,
  getMe,
  getSingleUser,
  updateUser,
  updateMyProfile,
  deleteOwnAccount,
  deleteUserById,
  deleteAllUsers,
};
