import { z } from "zod";

export const createClassZodSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  categoryId: z.string().min(1, { message: "Category ID is required" }),
  coachId: z.string().min(1, { message: "Coach ID is required" }),
  maxCapacity: z.number().min(1, { message: "Capacity must be at least 1" }),
  date: z.string().min(1, { message: "Date is required" }),
  startTime: z.string().min(1, { message: "Start time is required" }),
  endTime: z.string().min(1, { message: "End time is required" }),
  allowedPlans: z.array(z.string()).optional(),
  location: z.string().optional(),
  coachNotes: z.string().optional(),
  requirements: z.array(z.string()).optional(),
});

export const updateClassZodSchema = z.object({
  title: z.string().min(2).optional(),
  categoryId: z.string().optional(),
  coachId: z.string().optional(),
  maxCapacity: z.number().min(1).optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  allowedPlans: z.array(z.string()).optional(),
  location: z.string().optional(),
  coachNotes: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});
