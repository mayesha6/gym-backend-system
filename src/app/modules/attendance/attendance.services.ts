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
import { IsActive, Role, SubscriptionStatus } from "../user/user.interface";
import { User } from "../user/user.model";
import { AttendanceStatus, IAttendance, VerificationType } from "./attendance.interface";
import { Attendance } from "./attendance.model";

/**
 * Gym Scanner / Reception Camera scans a User's (Member/Coach) Personal QR Code to mark Attendance.
 * - Coach: Bypasses subscription & membership checks.
 * - Member: Requires ACTIVE subscription, valid expiry, and remaining monthly class allowance.
 */
const scanUserQRAndMarkAttendance = async (
  qrToken: string,
  bookingId?: string
) => {
  // 1. Decode & Verify scanned QR Token to obtain userId
  const userId = QRCodeServices.verifyUserQRToken(qrToken);
  const userObjectId = new Types.ObjectId(userId);

  // 2. Fetch User & verify active account
  const user = await User.findById(userObjectId).populate("currentPlan");
  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found or account deleted.");
  }

  if (user.isActive !== IsActive.ACTIVE) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      `User account status is ${user.isActive || "INACTIVE"}. Cannot mark attendance.`
    );
  }

  const todayStr = dayjs().format("YYYY-MM-DD");

  // 3. Check if attendance already exists for today (Check-Out / Re-scan scenario)
  const existingAttendance = await Attendance.findOne({
    userId: userObjectId,
    date: todayStr,
  });

  if (existingAttendance) {
    // Update checkOutTime with current timestamp
    existingAttendance.checkOutTime = new Date();

    // If a class booking is provided during check-out, associate it if not already done
    if (bookingId) {
      const booking = await ClassBooking.findOne({
        _id: new Types.ObjectId(bookingId),
        memberId: userObjectId,
      });

      if (booking && booking.status !== BookingStatus.ATTENDED) {
        booking.status = BookingStatus.ATTENDED;
        await booking.save();
      }

      if (booking) {
        existingAttendance.bookingId = booking._id as Types.ObjectId;
        existingAttendance.classId = booking.classId;
      }
    }

    await existingAttendance.save();

    return {
      attendance: existingAttendance,
      isCheckOut: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        memberId: user.memberId,
        role: user.role,
        picture: user.picture,
        subscriptionStatus: user.subscriptionStatus,
        currentPlan: user.currentPlan,
      },
    };
  }

  // FIRST SCAN OF THE DAY (CHECK-IN)
  let classIdToSave: Types.ObjectId | null = null;
  let bookingIdToSave: Types.ObjectId | null = null;

  // 4. Role-based checks: MEMBER requires active subscription; COACH is exempt
  if (user.role === Role.MEMBER) {
    if (user.subscriptionStatus !== SubscriptionStatus.ACTIVE) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        `Member does not have an active subscription (Status: ${user.subscriptionStatus || "INACTIVE"}).`
      );
    }

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
        "Member does not have an active membership plan to check-in."
      );
    }

    if (userMembership.expiryDate && new Date(userMembership.expiryDate) < new Date()) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Member's membership plan has expired. Please renew membership to check-in."
      );
    }

    const plan = await MembershipPlan.findById(userMembership.currentPlanId);
    if (plan && userMembership.classesUsedThisMonth >= plan.monthlyClassLimit) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        `Member has used all ${plan.monthlyClassLimit} classes for this month's allowance.`
      );
    }

    // Handle class booking if provided
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

    // Increment classes used count ONLY ONCE on first check-in of the day
    userMembership.classesUsedThisMonth += 1;
    await userMembership.save();
  }

  // 5. Create Attendance Record for 1st check-in of the day
  const newAttendance = await Attendance.create({
    userId: userObjectId,
    role: user.role,
    date: todayStr,
    checkInTime: new Date(),
    checkOutTime: null,
    status: AttendanceStatus.PRESENT,
    verificationType: VerificationType.QR_CODE,
    qrToken,
    bookingId: bookingIdToSave,
    classId: classIdToSave,
  });

  return {
    attendance: newAttendance,
    isCheckOut: false,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      memberId: user.memberId,
      role: user.role,
      picture: user.picture,
      subscriptionStatus: user.subscriptionStatus,
      currentPlan: user.currentPlan,
    },
  };
};

/**
 * Mark attendance via QR Code scan (Legacy / Member self-scan).
 */
const markAttendanceViaQR = async (
  userId: string,
  userRole: Role,
  token: string,
  bookingId?: string
): Promise<{ attendance: IAttendance; isCheckOut: boolean }> => {
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

  // 2. Check for existing attendance on the same day (Check-Out / Re-scan scenario)
  const existingAttendance = await Attendance.findOne({
    userId: userObjectId,
    date: todayStr,
  });

  if (existingAttendance) {
    // Update checkOutTime with current timestamp
    existingAttendance.checkOutTime = new Date();

    if (bookingId) {
      const booking = await ClassBooking.findOne({
        _id: new Types.ObjectId(bookingId),
        memberId: userObjectId,
      });

      if (booking && booking.status !== BookingStatus.ATTENDED) {
        booking.status = BookingStatus.ATTENDED;
        await booking.save();
      }

      if (booking) {
        existingAttendance.bookingId = booking._id as Types.ObjectId;
        existingAttendance.classId = booking.classId;
      }
    }

    await existingAttendance.save();
    return { attendance: existingAttendance, isCheckOut: true };
  }

  // FIRST SCAN OF THE DAY (CHECK-IN)
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

    // Increment classes used count ONLY ONCE on first check-in of the day
    userMembership.classesUsedThisMonth += 1;
    await userMembership.save();
  }

  // 4. Create Attendance Record for 1st check-in of the day
  const newAttendance = await Attendance.create({
    userId: userObjectId,
    role: userRole,
    date: todayStr,
    checkInTime: new Date(),
    checkOutTime: null,
    status: AttendanceStatus.PRESENT,
    verificationType: VerificationType.QR_CODE,
    qrToken: token,
    bookingId: bookingIdToSave,
    classId: classIdToSave,
  });

  return { attendance: newAttendance, isCheckOut: false };
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
  scanUserQRAndMarkAttendance,
  markAttendanceViaQR,
  getMyAttendanceHistory,
  getDailyAttendanceLogs,
};

