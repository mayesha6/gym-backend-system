import { Types } from "mongoose";
import { SubscriptionStatus } from "../subscription/subscription.interface";

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ORGANIZATION_ADMIN = "ORGANIZATION_ADMIN",
  DEPARTMENT_ADMIN = "DEPARTMENT_ADMIN",
  USER = "USER",
}

export enum AccountType {
  ORGANIZATION = "ORGANIZATION",
  INDIVIDUAL = "INDIVIDUAL"
}

export enum AccountStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface IAuthProvider {
  provider: "google" | "credentials";
  providerId: string;
}

export enum IsActive {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
}

export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  picture?: string;
  isDeleted?: boolean;
  isActive?: IsActive;
  isVerified?: boolean;
  role: Role;
  department: string; 
  phone?: string;
  companyName?: string;
  accountType: AccountType;
  status: AccountStatus;
  auths: IAuthProvider[];

  // 🔥 Multi-Tenant Data Isolation
  organizationId?: Types.ObjectId; // The Root Organization Admin's ID
  createdBy?: Types.ObjectId;      // Who created this account
  
  // 🔥 SaaS Subscription Tracking
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: SubscriptionStatus;
  currentPlan?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}
