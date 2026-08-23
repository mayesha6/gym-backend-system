import { z } from "zod";

export const createMembershipPlanZodSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  price: z.number().min(0, { message: "Price cannot be negative" }),
  monthlyClassLimit: z.number().min(1, { message: "Class limit must be at least 1" }),
  bookingWindowHours: z.number().optional(),
  supportLevel: z.string().optional(),
  features: z.array(z.string()).optional(),
  rules: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const updateMembershipPlanZodSchema = z.object({
  title: z.string().min(2).optional(),
  price: z.number().min(0).optional(),
  monthlyClassLimit: z.number().min(1).optional(),
  bookingWindowHours: z.number().optional(),
  supportLevel: z.string().optional(),
  features: z.array(z.string()).optional(),
  rules: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});
