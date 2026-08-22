import { Types } from "mongoose";

export enum BookingStatus {
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
}

export interface IClassBooking {
  _id?: Types.ObjectId;
  classId: Types.ObjectId;
  memberId: Types.ObjectId;
  status: BookingStatus;
  bookedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
