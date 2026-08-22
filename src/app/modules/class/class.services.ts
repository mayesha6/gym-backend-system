import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { IClassSession } from "./class.interface";
import { ClassSession } from "./class.model";

const createClass = async (payload: IClassSession) => {
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
