import { Types } from "mongoose";

export interface IGymSetting {
  _id?: Types.ObjectId;
  gymName: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  

  createdAt?: Date;
  updatedAt?: Date;
}
