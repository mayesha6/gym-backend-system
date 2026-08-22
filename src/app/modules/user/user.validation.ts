import { z } from "zod";
import { IsActive, Role } from "./user.interface";

export const createUserZodSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." }),
  email: z
    .string()
    .email({ message: "Invalid email address format." })
    .min(5, { message: "Email must be at least 5 characters long." })
    .max(100, { message: "Email cannot exceed 100 characters." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .regex(/^(?=.*[A-Z])/, {
      message: "Password must contain at least 1 uppercase letter.",
    })
    .regex(/^(?=.*[!@#$%^&*])/, {
      message: "Password must contain at least 1 special character.",
    })
    .regex(/^(?=.*\d)/, {
      message: "Password must contain at least 1 number.",
    }),
    department: z.string().optional(),
    companyName: z.string().optional(),
    phone: z.string().optional()
});

export const updateUserZodSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long." }).max(50, { message: "Name cannot exceed 50 characters." }).optional(),
  phone: z.string()
    .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
      message: "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
    })
    .optional(),
  companyName: z.string().optional(),
  role: z.enum(Object.values(Role) as [string, ...string[]]).optional(),
  isActive: z.enum(Object.values(IsActive) as [string, ...string[]]).optional(),
  isDeleted: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  picture: z.any().optional(),
  department: z.string().optional()
});
