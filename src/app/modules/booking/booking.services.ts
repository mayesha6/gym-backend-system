import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { doTimesOverlap, getClassDateTime, isSameDay } from "../../utils/timeUtils";
import { IClassSession } from "../class/class.interface";
import { ClassSession } from "../class/class.model";
import { MembershipServices } from "../membership/membership.services";
import { MembershipPlan } from "../membershipPlan/membershipPlan.model";
import { BookingStatus } from "./booking.interface";
import { ClassBooking } from "./booking.model";
import mongoose from "mongoose";

const enrollInClass = async (userId: string, classId: string) => {
  const classSession = await ClassSession.findById(classId);
  if (!classSession || !classSession.isActive) {
    throw new AppError(httpStatus.NOT_FOUND, "Class session not found or inactive");
  }

  // 1. Check Class End Time (Cannot enroll after class end time)
  const endDateTime = getClassDateTime(classSession.date, classSession.endTime);
  if (new Date() > endDateTime) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Class has already finished. You cannot enroll in a past class."
    );
  }

  // 2. Check Capacity
  const confirmedCount = await ClassBooking.countDocuments({
    classId: new mongoose.Types.ObjectId(classId),
    status: BookingStatus.CONFIRMED,
  });

  if (confirmedCount >= classSession.maxCapacity) {
    throw new AppError(httpStatus.BAD_REQUEST, "Class is fully booked");
  }

  // 2. Check Duplicate Enrollment
  const existingBooking = await ClassBooking.findOne({
    classId: new mongoose.Types.ObjectId(classId),
    memberId: new mongoose.Types.ObjectId(userId),
    status: BookingStatus.CONFIRMED,
  });

  if (existingBooking) {
    throw new AppError(httpStatus.BAD_REQUEST, "You are already enrolled in this class");
  }

  // 3. Check Member Schedule Conflict (Time Overlap with another booked class)
  const existingUserBookings = await ClassBooking.find({
    memberId: new mongoose.Types.ObjectId(userId),
    status: BookingStatus.CONFIRMED,
  }).populate("classId");

  for (const b of existingUserBookings) {
    const bookedClass = b.classId as unknown as IClassSession;
    if (bookedClass && bookedClass.isActive) {
      if (
        isSameDay(bookedClass.date, classSession.date) &&
        doTimesOverlap(
          classSession.startTime,
          classSession.endTime,
          bookedClass.startTime,
          bookedClass.endTime
        )
      ) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Schedule conflict: You are already enrolled in another class ("${bookedClass.title}") scheduled from ${bookedClass.startTime} to ${bookedClass.endTime} on this date`
        );
      }
    }
  }

  // 4. Check User Membership Allowance
  const membership = await MembershipServices.getMyMembership(userId);
  const plan = await MembershipPlan.findById(membership.currentPlanId);
  if (plan && membership.classesUsedThisMonth >= plan.monthlyClassLimit) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Monthly class limit of ${plan.monthlyClassLimit} reached for your current plan`
    );
  }

  // 5. Create Booking & Update Usage
  const booking = await ClassBooking.create({
    classId: new mongoose.Types.ObjectId(classId),
    memberId: new mongoose.Types.ObjectId(userId),
    status: BookingStatus.CONFIRMED,
    bookedAt: new Date(),
  });

  membership.classesUsedThisMonth += 1;
  await membership.save();

  return {
    booking,
    remainingAllowance: plan ? plan.monthlyClassLimit - membership.classesUsedThisMonth : 0,
    classSession,
  };
};

const unenrollFromClass = async (userId: string, classId: string) => {
  const booking = await ClassBooking.findOne({
    classId: new mongoose.Types.ObjectId(classId),
    memberId: new mongoose.Types.ObjectId(userId),
    status: BookingStatus.CONFIRMED,
  });

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Active booking not found for this class");
  }

  booking.status = BookingStatus.CANCELLED;
  await booking.save();

  // Restore Allowance
  const membership = await MembershipServices.getMyMembership(userId);
  if (membership.classesUsedThisMonth > 0) {
    membership.classesUsedThisMonth -= 1;
    await membership.save();
  }

  return booking;
};

const getWhosGoing = async (classId: string) => {
  const bookings = await ClassBooking.find({
    classId: new mongoose.Types.ObjectId(classId),
    status: BookingStatus.CONFIRMED,
  }).populate("memberId", "name picture memberId email");

  return {
    totalEnrolled: bookings.length,
    members: bookings.map((b) => b.memberId),
  };
};

const getClassRoster = async (classId: string) => {
  const bookings = await ClassBooking.find({
    classId: new mongoose.Types.ObjectId(classId),
    status: BookingStatus.CONFIRMED,
  })
    .populate("memberId", "name picture memberId email phone")
    .sort({ bookedAt: 1 });

  return bookings;
};

export const BookingServices = {
  enrollInClass,
  unenrollFromClass,
  getWhosGoing,
  getClassRoster,
};
