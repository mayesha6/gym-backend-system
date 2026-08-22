/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { UserServices } from "./user.services";

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {


    const user = await UserServices.createUser(req.body, req.user as JwtPayload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User Created Successfully. OTP sent to email. Please verify your account.",
      data: user,
    });
  }
);

const approveOrganization = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await UserServices.approveOrganization(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Organization approved successfully",
    data: result,
  });
});

const rejectOrganization = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await UserServices.rejectOrganization(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Organization rejected successfully",
    data: result,
  });
});

const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const result = await UserServices.getAllUsers(
      query as Record<string, string>,
      req.user as JwtPayload
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All Users Retrieved Successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);

const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const result = await UserServices.getMe(decodedToken.userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Your profile Retrieved Successfully",
      data: result.data,
    });
  }
);

const getSingleUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const decodedToken = req.user as JwtPayload; // Pass token for isolation check

    const result = await UserServices.getSingleUser(id, decodedToken);
    
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User Retrieved Successfully",
      data: result.data,
    });
  }
);

const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const verifiedToken = req.user;

    const payload = req.body;
    const user = await UserServices.updateUser(
      userId,
      payload,
      verifiedToken as JwtPayload
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User Updated Successfully",
      data: user,
    });
  }
);

const updateMyProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const userId = decodedToken.userId;
    const { oldPassword, newPassword, confirmPassword, ...restPayload } = req.body;

    const uploadedFile = (req.files as Express.MulterS3.File[])?.[0];

    const updatedUser = await UserServices.updateMyProfile({
      userId,
      payload: restPayload,
      decodedToken,
      file: uploadedFile,
      oldPassword,
      newPassword,
      confirmPassword,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Profile updated successfully.",
      data: updatedUser,
    });
  }
);

const deleteOwnAccount = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const decodedToken = req.user as JwtPayload;
  const userId = decodedToken.userId

  const result = await UserServices.deleteOwnAccount(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});


const deleteUserById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const decodedToken = req.user as JwtPayload;

    const result = await UserServices.deleteUserById(
      id,
      decodedToken
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User deleted successfully",
      data: result,
    });
  }
);

const deleteAllUsers = catchAsync(
  async (req: Request, res: Response) => {
    const result = await UserServices.deleteAllUsers();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All users deleted successfully",
      data: result,
    });
  }
);

const getUserBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await UserServices.getUserBySlug(slug);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User fetched successfully by slug",
    data: result,
  });
});

export const UserControllers = {
  createUser,
  approveOrganization,
  rejectOrganization,
  getAllUsers,
  getMe,
  getSingleUser,
  getUserBySlug,
  updateUser,
  updateMyProfile,
  deleteOwnAccount,
  deleteUserById,
  deleteAllUsers
};
