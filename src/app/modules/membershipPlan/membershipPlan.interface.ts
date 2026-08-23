import { Types } from "mongoose";

export interface IWhatsIncluded {
  title: string;
  description: string;
}

export interface IMembershipPlan {
  _id?: Types.ObjectId;
  title: string; // Basic, Standard, Premium
  price: number; // e.g. 49, 69, 99
  monthlyClassLimit: number; // e.g. 4, 8, 12
  bookingWindowHours: number; // e.g. 24, 48, 72
  supportLevel?: string; // Standard, Priority, VIP
  features: string[]; // Group Classes, Private Classes, etc.
  rules?: string[]; // Class allowance resets, booked 2 hours in advance, etc.
  whatsIncluded?: IWhatsIncluded[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
