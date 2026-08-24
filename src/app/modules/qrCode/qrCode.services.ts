import crypto from "crypto";
import QRCode from "qrcode";
import dayjs from "dayjs";
import { DailyQRCode } from "./qrCode.model";
import { IDailyQRCode } from "./qrCode.interface";
import { envVars } from "../../config/env";

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
  getOrGenerateTodayQR,
  regenerateTodayQR,
  validateDailyToken,
};
