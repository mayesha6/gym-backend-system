import { Types } from "mongoose";

export enum NotificationType {
  PICKUP_SCHEDULED = "PICKUP_SCHEDULED",
  DROP_OFF_REMINDER = "DROP_OFF_REMINDER",
  PICKUP_REMINDER = "PICKUP_REMINDER",
  STATUS_UPDATE = "STATUS_UPDATE",
  GENERAL = "GENERAL",
}

export interface INotification {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  body: string;
  type: NotificationType;
  isRead?: boolean;
  link?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}
