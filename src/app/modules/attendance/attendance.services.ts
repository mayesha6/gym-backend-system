import dayjs from "dayjs";
import httpStatus from "http-status-codes";
import { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { BookingStatus } from "../booking/booking.interface";
import { ClassBooking } from "../booking/booking.model";
import { MembershipStatus } from "../membership/membership.interface";
import { UserMembership } from "../membership/membership.model";
import { MembershipServices } from "../membership/membership.services";
import { MembershipPlan } from "../membershipPlan/membershipPlan.model";
import { QRCodeServices } from "../qrCode/qrCode.services";
import { Role } from "../user/user.interface";
import { AttendanceStatus, IAttendance, VerificationType } from "./attendance.interface";
import { Attendance } from "./attendance.model";

/**
 * Mark attendance via QR Code scan.
 */
const markAttendanceViaQR = async (
  userId: string,
  userRole: Role,
  token: string,
  bookingId?: string
): Promise<IAttendance> => {
  // 1. Validate QR token against today's active token
  const isValidToken = await QRCodeServices.validateDailyToken(token);
  if (!isValidToken) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid or expired QR code. Please scan today's active QR code at reception."
    );
  }

  const todayStr = dayjs().format("YYYY-MM-DD");
  const userObjectId = new Types.ObjectId(userId);

  // 2. Check for duplicate attendance on the same day
  const existingAttendance = await Attendance.findOne({
    userId: userObjectId,
    date: todayStr,
    ...(bookingId ? { bookingId: new Types.ObjectId(bookingId) } : {}),
  });

  if (existingAttendance) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Attendance already marked for today!"
    );
  }

  let classIdToSave: Types.ObjectId | null = null;
  let bookingIdToSave: Types.ObjectId | null = null;

  // 3. Role Specific Logic
  if (userRole === Role.MEMBER) {
    // Check Member Active Subscription & Remaining Class Credits
    let userMembership = await UserMembership.findOne({
      userId: userObjectId,
      status: { $in: [MembershipStatus.ACTIVE, MembershipStatus.PENDING_CHANGE] },
    }).populate("currentPlanId");

    if (!userMembership) {
      try {
        userMembership = await MembershipServices.getMyMembership(userId);
      } catch (err) {
        // Fallback silently if initialization fails
      }
    }

    if (
      !userMembership ||
      (userMembership.status !== MembershipStatus.ACTIVE &&
        userMembership.status !== MembershipStatus.PENDING_CHANGE)
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You do not have an active membership plan to check-in."
      );
    }

    if (userMembership.expiryDate && new Date(userMembership.expiryDate) < new Date()) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Your membership plan has expired. Please renew your membership to check-in."
      );
    }

    const plan = await MembershipPlan.findById(userMembership.currentPlanId);
    if (plan && userMembership.classesUsedThisMonth >= plan.monthlyClassLimit) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        `You have used all ${plan.monthlyClassLimit} classes for your monthly plan allowance.`
      );
    }

    // If specific booking ID provided, update booking status
    if (bookingId) {
      const booking = await ClassBooking.findOne({
        _id: new Types.ObjectId(bookingId),
        memberId: userObjectId,
      });

      if (!booking) {
        throw new AppError(httpStatus.NOT_FOUND, "Class booking not found.");
      }

      if (booking.status === BookingStatus.ATTENDED) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "This class booking has already been attended."
        );
      }

      booking.status = BookingStatus.ATTENDED;
      await booking.save();

      bookingIdToSave = booking._id as Types.ObjectId;
      classIdToSave = booking.classId;
    }

    // Increment classes used count
    userMembership.classesUsedThisMonth += 1;
    await userMembership.save();
  }

  // 4. Create Attendance Record
  const newAttendance = await Attendance.create({
    userId: userObjectId,
    role: userRole,
    date: todayStr,
    checkInTime: new Date(),
    status: AttendanceStatus.PRESENT,
    verificationType: VerificationType.QR_CODE,
    qrToken: token,
    bookingId: bookingIdToSave,
    classId: classIdToSave,
  });

  return newAttendance;
};

/**
 * Get attendance history for logged-in user.
 */
const getMyAttendanceHistory = async (userId: string) => {
  const history = await Attendance.find({ userId: new Types.ObjectId(userId) })
    .populate("classId")
    .populate("bookingId")
    .sort({ checkInTime: -1 });

  return history;
};

/**
 * Get all attendance logs for admin dashboard.
 */
const getDailyAttendanceLogs = async (date?: string) => {
  const targetDate = date || dayjs().format("YYYY-MM-DD");
  const logs = await Attendance.find({ date: targetDate })
    .populate("userId", "name email memberId role picture")
    .populate("classId")
    .sort({ checkInTime: -1 });

  return logs;
};

export const AttendanceServices = {
  markAttendanceViaQR,
  getMyAttendanceHistory,
  getDailyAttendanceLogs,
};
