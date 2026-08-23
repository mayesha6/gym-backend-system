import { model, Schema } from "mongoose";
import { IMembershipPlan, IWhatsIncluded } from "./membershipPlan.interface";

const whatsIncludedSchema = new Schema<IWhatsIncluded>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

const membershipPlanSchema = new Schema<IMembershipPlan>(
  {
    title: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    monthlyClassLimit: { type: Number, required: true },
    bookingWindowHours: { type: Number, required: true, default: 24 },
    supportLevel: { type: String, default: "Standard" },
    features: [{ type: String }],
    rules: [{ type: String }],
    whatsIncluded: [whatsIncludedSchema],
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const MembershipPlan = model<IMembershipPlan>("MembershipPlan", membershipPlanSchema);
