import { model, Schema } from "mongoose";
import { IGymSetting } from "./setting.interface";

const gymSettingSchema = new Schema<IGymSetting>(
  {
    gymName: { type: String, required: true, default: "Palestra Combat Club" },
    logo: { type: String, default: "" },
    address: { type: String, default: "42 Warrior Ave, Miami, FL 33101" },
    phone: { type: String, default: "+1 (305) 555-0190" },
    email: { type: String, default: "admin@palestra.club" },
    gymdeskApiKey: { type: String, default: "" },
    gymdeskSyncFrequency: { type: String, default: "Every 1 Hour" },
    gymdeskLastSyncAt: { type: Date, default: Date.now },
    gymdeskSyncStatus: { type: String, default: "Connected" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const GymSetting = model<IGymSetting>("GymSetting", gymSettingSchema);
