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

  // Membership Relation
  currentPlan?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

