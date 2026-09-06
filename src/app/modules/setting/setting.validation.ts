import { z } from "zod";

export const updateGymInfoZodSchema = z.object({
  gymName: z.string().min(2).optional(),
  logo: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});
