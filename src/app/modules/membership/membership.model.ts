import { model, Schema } from "mongoose";
import { IUserMembership, MembershipStatus } from "./membership.interface";

const userMembershipSchema = new Schema<IUserMembership>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    currentPlanId: { type: Schema.Types.ObjectId, ref: "MembershipPlan", required: true },
    status: {
      type: String,
      enum: Object.values(MembershipStatus),
      default: MembershipStatus.ACTIVE,
    },
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    classesUsedThisMonth: { type: Number, default: 0 },
    lastAllowanceResetDate: { type: Date, default: Date.now },
    pendingPlanId: { type: Schema.Types.ObjectId, ref: "MembershipPlan", default: null },
    noticeRequestedDate: { type: Date, default: null },
    pendingEffectiveDate: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const UserMembership = model<IUserMembership>("UserMembership", userMembershipSchema);
