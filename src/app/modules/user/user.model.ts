import { model, Schema } from "mongoose";
import { IAuthProvider, IEmergencyContact, IsActive, IUser, Role, SubscriptionStatus } from "./user.interface";

const authProviderSchema = new Schema<IAuthProvider>({
    provider: { type: String, required: true },
    providerId: { type: String, required: true }
}, {
    versionKey: false,
    _id: false
});

const emergencyContactSchema = new Schema<IEmergencyContact>({
    name: { type: String },
    phone: { type: String },
    relationship: { type: String }
}, {
    versionKey: false,
    _id: false
});

const userSchema = new Schema<IUser>({
    memberId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phone: { type: String },
    picture: { type: String },
    role: {
        type: String,
        enum: Object.values(Role),
        default: Role.MEMBER
    },
    isActive: {
        type: String,
        enum: Object.values(IsActive),
        default: IsActive.ACTIVE
    },
    isDeleted: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: true },
    dateOfBirth: { type: Date },
    joinDate: { type: Date, default: Date.now },
    emergencyContact: emergencyContactSchema,
    auths: [authProviderSchema],
    currentPlan: { type: Schema.Types.ObjectId, ref: "MembershipPlan", default: null },
    gymdeskMemberId: { type: String },
    subscriptionStatus: {
        type: String,
        enum: Object.values(SubscriptionStatus),
        default: SubscriptionStatus.INACTIVE
    },
    subscriptionStartDate: { type: Date },
    subscriptionEndDate: { type: Date }
}, {
    timestamps: true,
    versionKey: false
});

export const User = model<IUser>("User", userSchema);