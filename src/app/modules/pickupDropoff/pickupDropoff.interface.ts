import { Types } from "mongoose";

export enum PickupDropoffType {
  DROP_OFF = "DROP_OFF",
  PICKUP = "PICKUP",
  BOTH = "BOTH",
}

export enum PickupDropoffStatus {
  SCHEDULED = "SCHEDULED",
  DROPPED_OFF = "DROPPED_OFF",
  READY_FOR_PICKUP = "READY_FOR_PICKUP",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface IAssignedPerson {
  name: string;
  phone: string;
  relationship: string;
  vehicleInfo?: string;
}

export interface IRemindersSent {
  dropOffReminder?: boolean;
  pickUpReminder?: boolean;
}

export interface IPickupDropoff {
  _id?: Types.ObjectId;
  parentId: Types.ObjectId;
  childId: Types.ObjectId;
  classId?: Types.ObjectId;
  bookingId?: Types.ObjectId;
  type: PickupDropoffType;
  scheduledDate: Date;
  dropOffTime?: Date;
  pickUpTime?: Date;
  assignedPerson?: IAssignedPerson;
  status: PickupDropoffStatus;
  notes?: string;
  remindersSent?: IRemindersSent;
  createdAt?: Date;
  updatedAt?: Date;
}
