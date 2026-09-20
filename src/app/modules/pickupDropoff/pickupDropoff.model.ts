import { model, Schema } from "mongoose";
import {
  IAssignedPerson,
  IPickupDropoff,
  IRemindersSent,
  PickupDropoffStatus,
  PickupDropoffType,
} from "./pickupDropoff.interface";

const assignedPersonSchema = new Schema<IAssignedPerson>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, required: true },
    vehicleInfo: { type: String },
  },
  { _id: false, versionKey: false }
);

const remindersSentSchema = new Schema<IRemindersSent>(
  {
    dropOffReminder: { type: Boolean, default: false },
    pickUpReminder: { type: Boolean, default: false },
  },
  { _id: false, versionKey: false }
);

const pickupDropoffSchema = new Schema<IPickupDropoff>(
  {
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    childId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "ClassSession",
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "ClassBooking",
    },
    type: {
      type: String,
      enum: Object.values(PickupDropoffType),
      default: PickupDropoffType.BOTH,
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    dropOffTime: {
      type: Date,
    },
    pickUpTime: {
      type: Date,
    },
    assignedPerson: assignedPersonSchema,
    status: {
      type: String,
      enum: Object.values(PickupDropoffStatus),
      default: PickupDropoffStatus.SCHEDULED,
      index: true,
    },
    notes: {
      type: String,
    },
    remindersSent: {
      type: remindersSentSchema,
      default: () => ({ dropOffReminder: false, pickUpReminder: false }),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const PickupDropoff = model<IPickupDropoff>(
  "PickupDropoff",
  pickupDropoffSchema
);
