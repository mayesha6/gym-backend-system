import { model, Schema } from "mongoose";
import { AccountStatus, AccountType, IAuthProvider, IsActive, IUser, Role } from "./user.interface";
import { SubscriptionStatus } from "../subscription/subscription.interface";
import { Types } from "mongoose";


const authProviderSchema = new Schema<IAuthProvider>({
    provider: { type: String, required: true },
    providerId: { type: String, required: true }
}, {
    versionKey: false,
    _id: false
})

const userSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
        type: String,
        enum: Object.values(Role),
        default: Role.USER
    },
    department: { type: String, required: false, default: "Personal Account" },
    phone: { type: String, required: false },
    companyName: { type: String, required: false },
    accountType: {
        type: String,
        enum: Object.values(AccountType),
        default: AccountType.INDIVIDUAL
    },
    status: {
        type: String,
        enum: Object.values(AccountStatus),
        default: AccountStatus.APPROVED, // default normal user approved
    },

    picture: { type: String },
    isDeleted: { type: Boolean, default: false },
    isActive: {
        type: String,
        enum: Object.values(IsActive),
        default: IsActive.ACTIVE,
    },
    isVerified: { type: Boolean, default: false },
    auths: [authProviderSchema],
    // 🔥 SaaS & Tenant Fields
    organizationId: { type: Types.ObjectId, ref: "User", default: null },
    createdBy: { type: Types.ObjectId, ref: "User", default: null },
    
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    subscriptionStatus: { 
        type: String, 
        enum: Object.values(SubscriptionStatus),
        default: null 
    },
    currentPlan: { type: Types.ObjectId, ref: "Plan", default: null }
}, {
    timestamps: true,
    versionKey: false
})

export const User = model<IUser>("User", userSchema)