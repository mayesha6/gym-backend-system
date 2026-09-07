import { z } from "zod";

const markAttendanceSchema = z.object({
  token: z.string().min(1, { message: "QR token is required" }),
  bookingId: z.string().optional(),
});

const scanUserQRSchema = z.object({
  body: z.object({
    qrToken: z.string().min(1, { message: "User QR token is required" }),
    bookingId: z.string().optional(),
  }),
});

export const AttendanceValidations = {
  markAttendanceSchema,
  scanUserQRSchema,
};


