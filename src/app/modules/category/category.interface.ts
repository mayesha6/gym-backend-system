import { Types } from "mongoose";

export interface ICategory {
  _id?: Types.ObjectId;
  name: string; // Boxing, Muay Thai, Strength Training, Yoga, Conditioning
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
