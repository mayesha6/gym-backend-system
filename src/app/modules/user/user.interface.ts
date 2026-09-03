import { Types } from "mongoose";

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  COACH = "COACH",
  MEMBER = "MEMBER",
  USER = "USER"
}

export enum IsActive {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  BLOCKED = "BLOCKED"
}

export enum SubscriptionStatus {
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  CANCELED = "CANCELED",
  EXPIRED = "EXPIRED"
}

export interface IAuthProvider {
  provider: "google" | "credentials";
  providerId: string;
}

export interface IEmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
}

export interface IUser {
  _id?: Types.ObjectId;
  memberId?: string; // e.g. PC-00129
  name: string;
  email: string;
  password?: string;
  picture?: string;
  phone?: string;
  role: Role;
  isActive?: IsActive;
  isDeleted?: boolean;
  isVerified?: boolean;
  dateOfBirth?: Date;
  joinDate?: Date;
  emergencyContact?: IEmergencyContact;
  auths?: IAuthProvider[];

  // Membership & Gymdesk Relation
  currentPlan?: Types.ObjectId;
  gymdeskMemberId?: string;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

