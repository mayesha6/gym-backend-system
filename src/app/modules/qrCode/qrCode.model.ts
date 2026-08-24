import { model, Schema } from "mongoose";
import { IDailyQRCode } from "./qrCode.interface";

const dailyQRCodeSchema = new Schema<IDailyQRCode>(
  {
    date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
    token: { type: String, required: true },
    qrDataUrl: { type: String },
    checkInUrl: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

dailyQRCodeSchema.index({ date: 1 }, { unique: true });

export const DailyQRCode = model<IDailyQRCode>("DailyQRCode", dailyQRCodeSchema);
