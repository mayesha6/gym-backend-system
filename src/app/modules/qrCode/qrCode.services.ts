import crypto from "crypto";
import QRCode from "qrcode";
import dayjs from "dayjs";
import httpStatus from "http-status-codes";
import { DailyQRCode } from "./qrCode.model";
import { IDailyQRCode } from "./qrCode.interface";
import { envVars } from "../../config/env";
import { User } from "../user/user.model";
import { Role } from "../user/user.interface";
import AppError from "../../errorHelpers/AppError";

const extractIdString = (id: any): string => {
  if (!id) return "";
  if (typeof id === "string") return id;
  if (id._id) return id._id.toString();
  if (typeof id.toString === "function") return id.toString();
  return String(id);
};

/**
 * Generate personal QR code for a specific user (Member, Child, or Coach).
 */
const generateUserPersonalQR = async (loggedInUserId: string, childId?: string) => {
  const loggedInUser = await User.findById(loggedInUserId);
  if (!loggedInUser || loggedInUser.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  let targetUserId = loggedInUserId;

  if (childId) {
    const childUser = await User.findById(childId);
    if (!childUser || childUser.isDeleted) {
      throw new AppError(httpStatus.NOT_FOUND, "Child profile not found");
    }

    const childParentIdStr = extractIdString(childUser.parentId);
    const loggedInUserIdStr = extractIdString(loggedInUserId);

    if (
      loggedInUser.role === Role.PARENT ||
      loggedInUser.role === Role.USER ||
      loggedInUser.role === Role.MEMBER
    ) {
      if (!childParentIdStr) {
        childUser.parentId = loggedInUser._id as any;
        await childUser.save();
      } else if (childParentIdStr !== loggedInUserIdStr) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You can only generate QR code for your own child"
        );
      }
    }
    targetUserId = childId;
  } else if (loggedInUser.role === Role.PARENT) {
    const children = await User.find({ parentId: loggedInUserId, isDeleted: { $ne: true } });
    if (children.length > 0) {
      targetUserId = children[0]._id.toString();
    }
  }

  const user = await User.findById(targetUserId).populate("currentPlan");
  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const signature = crypto
    .createHmac("sha256", envVars.JWT_ACCESS_SECRET)
    .update(user._id.toString())
    .digest("hex");

  const qrToken = `USER_QR:${user._id.toString()}:${signature}`;

  // Generate Base64 Data URL for member screen
  const qrDataUrl = await QRCode.toDataURL(qrToken, {
    width: 250,
    margin: 2,
  });

  return {
    qrToken,
    qrDataUrl,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      memberId: user.memberId,
      picture: user.picture,
      subscriptionStatus: user.subscriptionStatus,
      currentPlan: user.currentPlan,
    },
  };
};

/**
 * Verify scanned User QR Token and return user ID.
 */
const verifyUserQRToken = (qrToken: string): string => {
  if (!qrToken) {
    throw new AppError(httpStatus.BAD_REQUEST, "QR token is required");
  }

  // Format: USER_QR:<userId>:<signature>
  if (qrToken.startsWith("USER_QR:")) {
    const parts = qrToken.split(":");
    if (parts.length === 3) {
      const userId = parts[1];
      const signature = parts[2];
      const expectedSignature = crypto
        .createHmac("sha256", envVars.JWT_ACCESS_SECRET)
        .update(userId)
        .digest("hex");

      if (signature === expectedSignature) {
        return userId;
      }
    }
  }

  // Fallback if raw Mongoose ObjectId string was passed
  if (qrToken.length === 24) {
    return qrToken;
  }

  throw new AppError(httpStatus.BAD_REQUEST, "Invalid or corrupted User QR code");
};

/**
 * Get today's active QR code token & data URL.
 * If not exists for today, creates a new one expiring at 12:00 AM midnight.
 */
const getOrGenerateTodayQR = async (): Promise<IDailyQRCode> => {
  const todayStr = dayjs().format("YYYY-MM-DD");
  
  // Check if today's QR code already exists
  let dailyQR = await DailyQRCode.findOne({ date: todayStr });

  if (!dailyQR) {
    // Generate secure random daily token combined with date secret
    const rawSecret = `${todayStr}-${envVars.JWT_ACCESS_SECRET}-${crypto.randomBytes(16).toString("hex")}`;
    const token = crypto.createHash("sha256").update(rawSecret).digest("hex");

    // Check-in URL that member scans with phone camera
    const baseUrl = envVars.FRONTEND_URL || envVars.FRONTEND_DOMAIN_URL || "http://localhost:3000";
    const checkInUrl = `${baseUrl}/attendance/check-in?token=${token}`;

    // Generate Base64 Data URL with compact dimensions (Lightweight & HD)
    const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
      width: 150,
      margin: 1,
    });

    // Expiry set to 12:00 AM midnight of next day
    const expiresAt = dayjs().endOf("day").toDate();

    dailyQR = await DailyQRCode.create({
      date: todayStr,
      token,
      checkInUrl,
      qrDataUrl,
      expiresAt,
    });
  }

  // Optimize existing dailyQR data URL if oversized (> 2000 chars)
  if (dailyQR && dailyQR.qrDataUrl && dailyQR.qrDataUrl.length > 2000) {
    dailyQR.qrDataUrl = await QRCode.toDataURL(dailyQR.checkInUrl, {
      width: 150,
      margin: 1,
    });
    await dailyQR.save();
  }

  return dailyQR;
};

/**
 * Force regenerate today's active QR code token & data URL.
 * Deletes existing QR code for today and generates a brand new token with updated FRONTEND_URL.
 */
const regenerateTodayQR = async (): Promise<IDailyQRCode> => {
  const todayStr = dayjs().format("YYYY-MM-DD");
  await DailyQRCode.deleteOne({ date: todayStr });
  return getOrGenerateTodayQR();
};

/**
 * Validate scanned token against today's valid token.
 */
const validateDailyToken = async (token: string): Promise<boolean> => {
  const todayStr = dayjs().format("YYYY-MM-DD");
  const dailyQR = await DailyQRCode.findOne({ date: todayStr, token });
  
  if (!dailyQR) {
    return false;
  }

  // Double check expiration boundary (Midnight 12 AM)
  if (dayjs().isAfter(dailyQR.expiresAt)) {
    return false;
  }

  return true;
};

export const QRCodeServices = {
  generateUserPersonalQR,
  verifyUserQRToken,
  getOrGenerateTodayQR,
  regenerateTodayQR,
  validateDailyToken,
};

