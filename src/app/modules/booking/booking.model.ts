import { model, Schema } from "mongoose";
import { BookingStatus, IClassBooking } from "./booking.interface";

const classBookingSchema = new Schema<IClassBooking>(
  {
    classId: { type: Schema.Types.ObjectId, ref: "ClassSession", required: true },
    memberId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.CONFIRMED,
    },
    bookedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

classBookingSchema.index({ classId: 1, memberId: 1, status: 1 });

export const ClassBooking = model<IClassBooking>("ClassBooking", classBookingSchema);
