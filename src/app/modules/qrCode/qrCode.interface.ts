import { Types } from "mongoose";

export interface IDailyQRCode {
  _id?: Types.ObjectId;
  date: string; // Format: YYYY-MM-DD
  token: string; // Hashed/encrypted daily token
  qrDataUrl?: string; // Base64 Data URL for rendering QR image on Admin screen
  checkInUrl: string; // The URL that phone camera opens when scanned
  expiresAt: Date; // Midnight 12:00 AM of next day
  createdAt?: Date;
  updatedAt?: Date;
}
