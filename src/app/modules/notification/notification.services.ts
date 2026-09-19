import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { Notification } from "./notification.model";

const getMyNotifications = async (userId: string) => {
  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(50);
  const unreadCount = await Notification.countDocuments({ userId, isRead: false });

  return {
    unreadCount,
    notifications,
  };
};

const markAsRead = async (userId: string, notificationId: string) => {
  const notification = await Notification.findOne({ _id: notificationId, userId });
  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
  }

  notification.isRead = true;
  await notification.save();
  return notification;
};

const markAllAsRead = async (userId: string) => {
  await Notification.updateMany({ userId, isRead: false }, { isRead: true });
  return { message: "All notifications marked as read" };
};

export const NotificationServices = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
