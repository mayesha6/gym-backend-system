import { z } from "zod";

const markAttendanceSchema = z.object({
  body: z.object({
    token: z.string().min(1, { message: "QR token is required" }),
    bookingId: z.string().optional(),
  }),
});

export const AttendanceValidations = {
  markAttendanceSchema,
};
