import cron from "node-cron";
import { PickupDropoff } from "../modules/pickupDropoff/pickupDropoff.model";
import { PickupDropoffStatus } from "../modules/pickupDropoff/pickupDropoff.interface";
import { ClassBooking } from "../modules/booking/booking.model";
import { BookingStatus } from "../modules/booking/booking.interface";
import { ClassSession } from "../modules/class/class.model";

/**
 * Sweeps through past schedules and bookings.
 * Marks unfulfilled Pickup/Dropoff schedules as ABSENT
 * and unfulfilled Class Bookings as MISSED.
 */
export const checkAndUpdatePastSchedules = async () => {
  try {
    const now = new Date();
    // Start of current day (00:00:00 local time)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Update Pickup & Drop-off schedules past their scheduled date
    const pickupResult = await PickupDropoff.updateMany(
      {
        scheduledDate: { $lt: startOfToday },
        status: PickupDropoffStatus.SCHEDULED,
      },
      {
        $set: { status: PickupDropoffStatus.ABSENT },
      }
    );

    if (pickupResult.modifiedCount > 0) {
      console.log(`[ScheduleCron] 📌 Marked ${pickupResult.modifiedCount} past pickup/dropoff schedule(s) as ABSENT.`);
    }

    // 2. Update Class Bookings where class date has passed without attendance
    const pastClasses = await ClassSession.find({
      date: { $lt: startOfToday },
    }).select("_id");

    if (pastClasses.length > 0) {
      const pastClassIds = pastClasses.map((c) => c._id);
      const bookingResult = await ClassBooking.updateMany(
        {
          classId: { $in: pastClassIds },
          status: BookingStatus.CONFIRMED,
        },
        {
          $set: { status: BookingStatus.MISSED },
        }
      );

      if (bookingResult.modifiedCount > 0) {
        console.log(`[ScheduleCron] 📌 Marked ${bookingResult.modifiedCount} past class booking(s) as MISSED.`);
      }
    }
  } catch (error) {
    console.error("[ScheduleCron Error] Failed to process past schedules update:", error);
  }
};

export const initScheduleStatusCron = () => {
  console.log("⏰ Initializing Past Schedule & Booking Status Cron Engine...");

  // Execute immediately on startup to clean up existing past dates
  checkAndUpdatePastSchedules();

  // Schedule to run every day at midnight (00:00)
  cron.schedule("0 0 * * *", () => {
    checkAndUpdatePastSchedules();
  });
};
