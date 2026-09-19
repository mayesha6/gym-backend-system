import cron from "node-cron";
import { PickupDropoff } from "../modules/pickupDropoff/pickupDropoff.model";
import { PickupDropoffStatus } from "../modules/pickupDropoff/pickupDropoff.interface";
import { sendWebPushNotification } from "../utils/pushNotification";
import { NotificationType } from "../modules/notification/notification.interface";

export const initReminderCron = () => {
  console.log("⏰ Initializing Automated Pickup & Drop-off Reminder Cron Engine...");

  // Run every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();
      const in30Mins = new Date(now.getTime() + 30 * 60 * 1000);
      const in15Mins = new Date(now.getTime() + 15 * 60 * 1000);

      // 1. Process Drop-off Reminders (30 minutes before drop-off time)
      const upcomingDropOffs = await PickupDropoff.find({
        status: PickupDropoffStatus.SCHEDULED,
        "remindersSent.dropOffReminder": { $ne: true },
        $or: [
          { dropOffTime: { $gte: now, $lte: in30Mins } },
          { scheduledDate: { $gte: now, $lte: in30Mins }, dropOffTime: { $exists: false } },
        ],
      }).populate("childId", "name");

      for (const schedule of upcomingDropOffs) {
        const childName = (schedule.childId as any)?.name || "your child";
        await sendWebPushNotification({
          userId: schedule.parentId,
          title: "Upcoming Drop-off Reminder 🚗",
          body: `Reminder: Drop-off for ${childName} is scheduled in less than 30 minutes!`,
          type: NotificationType.DROP_OFF_REMINDER,
          link: `/dashboard/pickup-dropoff/${schedule._id}`,
          metadata: { scheduleId: schedule._id },
        });

        schedule.remindersSent = {
          ...schedule.remindersSent,
          dropOffReminder: true,
        };
        await schedule.save();
      }

      // 2. Process Pickup Reminders (15 minutes before pickup time)
      const upcomingPickups = await PickupDropoff.find({
        status: { $in: [PickupDropoffStatus.SCHEDULED, PickupDropoffStatus.DROPPED_OFF, PickupDropoffStatus.READY_FOR_PICKUP] },
        "remindersSent.pickUpReminder": { $ne: true },
        pickUpTime: { $gte: now, $lte: in15Mins },
      }).populate("childId", "name");

      for (const schedule of upcomingPickups) {
        const childName = (schedule.childId as any)?.name || "your child";
        await sendWebPushNotification({
          userId: schedule.parentId,
          title: "Upcoming Pickup Reminder ⏰",
          body: `Reminder: Pickup for ${childName} is scheduled in less than 15 minutes!`,
          type: NotificationType.PICKUP_REMINDER,
          link: `/dashboard/pickup-dropoff/${schedule._id}`,
          metadata: { scheduleId: schedule._id },
        });

        schedule.remindersSent = {
          ...schedule.remindersSent,
          pickUpReminder: true,
        };
        await schedule.save();
      }
    } catch (error) {
      console.error("[ReminderCron Error] Failed to execute reminder checks:", error);
    }
  });
};
