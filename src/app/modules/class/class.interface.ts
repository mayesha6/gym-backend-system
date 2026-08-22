import { Types } from "mongoose";

export interface IClassSession {
  _id?: Types.ObjectId;
  title: string;
  categoryId: Types.ObjectId;
  coachId: Types.ObjectId;
  maxCapacity: number;
  date: Date;
  startTime: string;
  endTime: string;
  allowedPlans?: string[];
  location?: string;
  coachNotes?: string;
  requirements?: string[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
