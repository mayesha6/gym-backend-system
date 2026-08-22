import { z } from "zod";

export const requestPlanChangeZodSchema = z.object({
  targetPlanId: z.string().min(1, { message: "Target plan ID is required" }),
});

export const cancelMembershipZodSchema = z.object({
  reason: z.string().optional(),
});
