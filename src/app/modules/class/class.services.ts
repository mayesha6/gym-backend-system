import httpStatus from "http-status-codes";
import mongoose, { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { doTimesOverlap, getClassDateTime, isSameDay } from "../../utils/timeUtils";
import { BookingStatus } from "../booking/booking.interface";
import { ClassBooking } from "../booking/booking.model";
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

const getWeeklySchedule = async (startDate?: string, endDate?: string, userId?: string) => {
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

  const classIds = classes.map((c) => c._id);

  let userBookedClassIds = new Set<string>();
  if (userId) {
    const userBookings = await ClassBooking.find({
      memberId: new mongoose.Types.ObjectId(userId),
      classId: { $in: classIds },
      status: BookingStatus.CONFIRMED,
    }).select("classId");

    userBookedClassIds = new Set(userBookings.map((b) => b.classId.toString()));
  }

  const bookingCounts = await ClassBooking.aggregate([
    {
      $match: {
        classId: { $in: classIds },
        status: BookingStatus.CONFIRMED,
      },
    },
    {
      $group: {
        _id: "$classId",
        count: { $sum: 1 },
      },
    },
  ]);

  const bookingCountMap = new Map<string, number>();
  bookingCounts.forEach((b) => {
    bookingCountMap.set(b._id.toString(), b.count);
  });

  const now = new Date();

  const formattedClasses = classes.map((cls) => {
    const clsObj = cls.toObject();
    const enrolledCount = bookingCountMap.get(cls._id.toString()) || 0;
    const remainingSeats = Math.max(0, cls.maxCapacity - enrolledCount);
    const isEnrolled = userBookedClassIds.has(cls._id.toString());

    const startDateTime = getClassDateTime(cls.date, cls.startTime);
    const endDateTime = getClassDateTime(cls.date, cls.endTime);

    let status = "AVAILABLE";
    if (isEnrolled) {
      status = "ENROLLED";
    } else if (now > endDateTime) {
      status = "FINISHED";
    } else if (remainingSeats === 0) {
      status = "FULL";
    } else if (now >= startDateTime && now <= endDateTime) {
      status = "ONGOING";
    }

    return {
      ...clsObj,
      enrolledCount,
      remainingSeats,
      isEnrolled,
      status,
    };
  });

  return formattedClasses;
};

const getSingleClass = async (id: string, userId?: string) => {
  const classSession = await ClassSession.findById(id)
    .populate("categoryId")
    .populate("coachId", "name email picture phone");

  if (!classSession) {
    throw new AppError(httpStatus.NOT_FOUND, "Class session not found");
  }

  const enrolledCount = await ClassBooking.countDocuments({
    classId: new mongoose.Types.ObjectId(id),
    status: BookingStatus.CONFIRMED,
  });

  const remainingSeats = Math.max(0, classSession.maxCapacity - enrolledCount);

  let isEnrolled = false;
  if (userId) {
    const userBooking = await ClassBooking.findOne({
      classId: new mongoose.Types.ObjectId(id),
      memberId: new mongoose.Types.ObjectId(userId),
      status: BookingStatus.CONFIRMED,
    });
    isEnrolled = !!userBooking;
  }

  const now = new Date();
  const startDateTime = getClassDateTime(classSession.date, classSession.startTime);
  const endDateTime = getClassDateTime(classSession.date, classSession.endTime);

  let status = "AVAILABLE";
  if (isEnrolled) {
    status = "ENROLLED";
  } else if (now > endDateTime) {
    status = "FINISHED";
  } else if (remainingSeats === 0) {
    status = "FULL";
  } else if (now >= startDateTime && now <= endDateTime) {
    status = "ONGOING";
  }

  return {
    ...classSession.toObject(),
    enrolledCount,
    remainingSeats,
    isEnrolled,
    status,
  };
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

