import httpStatus from "http-status-codes";
import mongoose, { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { doTimesOverlap, isSameDay } from "../../utils/timeUtils";
import { IClassSession } from "./class.interface";
import { ClassSession } from "./class.model";

const checkCoachScheduleConflict = async (
  coachId: string | Types.ObjectId,
  date: Date | string,
  startTime: string,
  endTime: string,
  excludeClassId?: string
) => {
  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const filter: any = {
    coachId: new mongoose.Types.ObjectId(coachId),
    isActive: true,
    date: { $gte: startOfDay, $lte: endOfDay },
  };

  if (excludeClassId) {
    filter._id = { $ne: new mongoose.Types.ObjectId(excludeClassId) };
  }

  const existingClasses = await ClassSession.find(filter);

  for (const existing of existingClasses) {
    if (
      isSameDay(existing.date, date) &&
      doTimesOverlap(startTime, endTime, existing.startTime, existing.endTime)
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Coach schedule conflict: Coach already has an active class ("${existing.title}") scheduled from ${existing.startTime} to ${existing.endTime} on this date`
      );
    }
  }
};

const createClass = async (payload: IClassSession) => {
  await checkCoachScheduleConflict(
    payload.coachId,
    payload.date,
    payload.startTime,
    payload.endTime
  );

  const classSession = await ClassSession.create(payload);
  return classSession;
};

const getWeeklySchedule = async (startDate?: string, endDate?: string) => {
  const filter: any = { isActive: true };

  if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const classes = await ClassSession.find(filter)
    .populate("categoryId")
    .populate("coachId", "name email picture phone")
    .sort({ date: 1, startTime: 1 });

  return classes;
};

const getSingleClass = async (id: string) => {
  const classSession = await ClassSession.findById(id)
    .populate("categoryId")
    .populate("coachId", "name email picture phone");

  if (!classSession) {
    throw new AppError(httpStatus.NOT_FOUND, "Class session not found");
  }

  return classSession;
};

const updateClass = async (id: string, payload: Partial<IClassSession>) => {
  const classSession = await ClassSession.findById(id);
  if (!classSession) {
    throw new AppError(httpStatus.NOT_FOUND, "Class session not found");
  }

  const coachId = payload.coachId || classSession.coachId;
  const date = payload.date || classSession.date;
  const startTime = payload.startTime || classSession.startTime;
  const endTime = payload.endTime || classSession.endTime;

  await checkCoachScheduleConflict(coachId, date, startTime, endTime, id);

  const updatedClass = await ClassSession.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  })
    .populate("categoryId")
    .populate("coachId", "name email picture phone");

  return updatedClass;
};

const deleteClass = async (id: string) => {
  const classSession = await ClassSession.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!classSession) {
    throw new AppError(httpStatus.NOT_FOUND, "Class session not found");
  }

  return classSession;
};

export const ClassServices = {
  createClass,
  getWeeklySchedule,
  getSingleClass,
  updateClass,
  deleteClass,
};

