import { model, Schema } from "mongoose";
import { AttendanceStatus, IAttendance, VerificationType } from "./attendance.interface";
import { Role } from "../user/user.interface";

const attendanceSchema = new Schema<IAttendance>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: Object.values(Role), required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    checkInTime: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: Object.values(AttendanceStatus),
      default: AttendanceStatus.PRESENT,
    },
    verificationType: {
      type: String,
      enum: Object.values(VerificationType),
      default: VerificationType.QR_CODE,
    },
    bookingId: { type: Schema.Types.ObjectId, ref: "ClassBooking", default: null },
    classId: { type: Schema.Types.ObjectId, ref: "ClassSession", default: null },
    qrToken: { type: String },
    notes: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Prevent duplicate attendance for the same user on the same date for general checkin/booking
attendanceSchema.index({ userId: 1, date: 1, bookingId: 1 }, { unique: true });
attendanceSchema.index({ date: 1, role: 1 });

export const Attendance = model<IAttendance>("Attendance", attendanceSchema);
