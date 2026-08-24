import { Types } from "mongoose";
import { Role } from "../user/user.interface";

export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
}

export enum VerificationType {
  QR_CODE = "QR_CODE",
  MANUAL = "MANUAL",
}

export interface IAttendance {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  role: Role;
  date: string; // Format: YYYY-MM-DD
  checkInTime: Date;
  status: AttendanceStatus;
  verificationType: VerificationType;
  bookingId?: Types.ObjectId | null;
  classId?: Types.ObjectId | null;
  qrToken?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
