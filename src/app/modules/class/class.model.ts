import { model, Schema } from "mongoose";
import { IClassSession } from "./class.interface";

const classSessionSchema = new Schema<IClassSession>(
  {
    title: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    coachId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    maxCapacity: { type: Number, required: true, default: 16 },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    allowedPlans: [{ type: String }],
    location: { type: String, default: "Main Studio" },
    coachNotes: { type: String, default: "" },
    requirements: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const ClassSession = model<IClassSession>("ClassSession", classSessionSchema);
