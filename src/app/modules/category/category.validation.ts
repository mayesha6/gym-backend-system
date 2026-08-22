import { z } from "zod";

export const createCategoryZodSchema = z.object({
  name: z.string().min(2, { message: "Category name must be at least 2 characters" }),
});

export const updateCategoryZodSchema = z.object({
  name: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
});
