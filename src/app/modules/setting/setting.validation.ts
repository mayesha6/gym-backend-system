import { z } from "zod";

export const updateGymInfoZodSchema = z.object({
  gymName: z.string().min(2).optional(),
  logo: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export const updateGymdeskConfigZodSchema = z.object({
  gymdeskApiKey: z.string().min(1, { message: "API key is required" }),
  gymdeskSyncFrequency: z.string().optional(),
});
