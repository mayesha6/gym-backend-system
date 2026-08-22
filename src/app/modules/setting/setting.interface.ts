import { Types } from "mongoose";

export interface IGymSetting {
  _id?: Types.ObjectId;
  gymName: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  
  // Gymdesk Integration Fields
  gymdeskApiKey?: string;
  gymdeskSyncFrequency?: string;
  gymdeskLastSyncAt?: Date;
  gymdeskSyncStatus?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}
