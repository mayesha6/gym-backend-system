import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { SettingServices } from "./setting.services";

const getGymInfo = catchAsync(async (req: Request, res: Response) => {
  const result = await SettingServices.getGymInfo();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Gym profile information fetched successfully",
    data: result,
  });
});

const updateGymInfo = catchAsync(async (req: Request, res: Response) => {
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const file = req.files[0] as Express.MulterS3.File;
    req.body.logo = file.location;
  }
  const result = await SettingServices.updateGymInfo(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Gym profile information updated successfully",
    data: result,
  });
});

const updateGymdeskConfig = catchAsync(async (req: Request, res: Response) => {
  const { gymdeskApiKey, gymdeskSyncFrequency } = req.body;
  const result = await SettingServices.updateGymdeskConfig(gymdeskApiKey, gymdeskSyncFrequency);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Gymdesk configuration updated successfully",
    data: result,
  });
});

const triggerGymdeskSync = catchAsync(async (req: Request, res: Response) => {
  const result = await SettingServices.triggerGymdeskSync();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Gymdesk sync executed successfully",
    data: result,
  });
});

export const SettingControllers = {
  getGymInfo,
  updateGymInfo,
  updateGymdeskConfig,
  triggerGymdeskSync,
};
