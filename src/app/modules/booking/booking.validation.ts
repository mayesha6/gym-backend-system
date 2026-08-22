import { z } from "zod";

export const enrollClassZodSchema = z.object({
  classId: z.string().min(1, { message: "Class ID is required" }),
});
