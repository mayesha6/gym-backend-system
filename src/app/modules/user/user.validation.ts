import { z } from "zod";
import { IsActive, Role } from "./user.interface";

export const addMemberZodSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long." }),
  email: z.string().email({ message: "Invalid email address format." }),
  phone: z.string().optional(),
  membershipPlan: z.string().optional(),
  startDate: z.string().optional(),
  expireDate: z.string().optional(),
  status: z.enum(Object.values(IsActive) as [string, ...string[]]).optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional()
  }).optional()
});

export const createUserZodSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long." }),
  email: z.string().email({ message: "Invalid email address format." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
  phone: z.string().optional(),
  role: z.enum(Object.values(Role) as [string, ...string[]]).optional()
});

export const updateUserZodSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.enum(Object.values(Role) as [string, ...string[]]).optional(),
  isActive: z.enum(Object.values(IsActive) as [string, ...string[]]).optional(),
  isDeleted: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  picture: z.any().optional(),
  dateOfBirth: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional()
  }).optional()
});

