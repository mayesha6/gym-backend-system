import { z } from "zod";
import { PickupDropoffStatus, PickupDropoffType } from "./pickupDropoff.interface";

export const createPickupDropoffZodSchema = z.object({
  body: z.object({
    childId: z.string().min(1, { message: "Child/Member ID is required" }),
    classId: z.string().optional(),
    bookingId: z.string().optional(),
    type: z.nativeEnum(PickupDropoffType).optional(),
    scheduledDate: z.string().min(1, { message: "Scheduled date is required" }),
    dropOffTime: z.string().optional(),
    pickUpTime: z.string().optional(),
    assignedPerson: z
      .object({
        name: z.string().min(1, { message: "Assigned person name is required" }),
        phone: z.string().min(1, { message: "Assigned person phone is required" }),
        relationship: z.string().min(1, { message: "Relationship is required" }),
        vehicleInfo: z.string().optional(),
      })
      .optional(),
    notes: z.string().optional(),
  }),
});

export const updatePickupDropoffZodSchema = z.object({
  body: z.object({
    type: z.nativeEnum(PickupDropoffType).optional(),
    scheduledDate: z.string().optional(),
    dropOffTime: z.string().optional(),
    pickUpTime: z.string().optional(),
    assignedPerson: z
      .object({
        name: z.string().optional(),
        phone: z.string().optional(),
        relationship: z.string().optional(),
        vehicleInfo: z.string().optional(),
      })
      .optional(),
    notes: z.string().optional(),
  }),
});

export const updatePickupDropoffStatusZodSchema = z.object({
  body: z.object({
    status: z.nativeEnum(PickupDropoffStatus),
  }),
});

export const PickupDropoffValidations = {
  createPickupDropoffZodSchema,
  updatePickupDropoffZodSchema,
  updatePickupDropoffStatusZodSchema,
};
