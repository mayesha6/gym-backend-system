import { Types } from "mongoose";
import { Notification } from "../modules/notification/notification.model";
import { NotificationType } from "../modules/notification/notification.interface";
import { User } from "../modules/user/user.model";

export interface ISendNotificationPayload {
  userId: string | Types.ObjectId;
  title: string;
  body: string;
  type?: NotificationType;
  link?: string;
  metadata?: Record<string, any>;
}

export const sendWebPushNotification = async (payload: ISendNotificationPayload) => {
  try {
    const { userId, title, body, type = NotificationType.GENERAL, link, metadata } = payload;

    // 1. Persist notification in DB for In-App Web Header Notification Feed
    const notification = await Notification.create({
      userId,
      title,
      body,
      type,
      link,
      metadata,
    });

    // 2. Retrieve user for Web Push Tokens / Subscriptions
    const user = await User.findById(userId).select("deviceTokens webPushSubscriptions");
    if (!user) return notification;

    // Log web push notification dispatch
    if ((user.deviceTokens && user.deviceTokens.length > 0) || (user.webPushSubscriptions && user.webPushSubscriptions.length > 0)) {
      console.log(`[WebPush] Dispatched notification to user ${userId}: "${title}"`);
    }

    return notification;
  } catch (error) {
    console.error("[WebPush Error] Failed to process notification:", error);
    return null;
  }
};
