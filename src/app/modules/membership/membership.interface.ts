import { Types } from "mongoose";

export enum MembershipStatus {
  ACTIVE = "ACTIVE",
  PENDING_CHANGE = "PENDING_CHANGE",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED"
}

export interface IUserMembership {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  currentPlanId: Types.ObjectId;
  status: MembershipStatus;
  startDate: Date;
  expiryDate: Date;
  classesUsedThisMonth: number;
  lastAllowanceResetDate: Date;
  
  // 30-Day Notice Queue for Downgrades & Cancellations
  pendingPlanId?: Types.ObjectId | null;
  noticeRequestedDate?: Date | null;
  pendingEffectiveDate?: Date | null;
  
  createdAt?: Date;
  updatedAt?: Date;
}
