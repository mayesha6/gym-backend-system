import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { sendWebPushNotification } from "../../utils/pushNotification";
import { NotificationType } from "../notification/notification.interface";
import { Role } from "../user/user.interface";
import { User } from "../user/user.model";
import { IPickupDropoff, PickupDropoffStatus } from "./pickupDropoff.interface";
import { PickupDropoff } from "./pickupDropoff.model";

const createSchedule = async (parentId: string, payload: Partial<IPickupDropoff>) => {
  const child = await User.findById(payload.childId);
  if (!child) {
    throw new AppError(httpStatus.NOT_FOUND, "Child / Member account not found");
  }

  const newSchedule = await PickupDropoff.create({
    ...payload,
    parentId,
    scheduledDate: new Date(payload.scheduledDate!),
    dropOffTime: payload.dropOffTime ? new Date(payload.dropOffTime) : undefined,
    pickUpTime: payload.pickUpTime ? new Date(payload.pickUpTime) : undefined,
    status: PickupDropoffStatus.SCHEDULED,
  });

  const populatedSchedule = await PickupDropoff.findById(newSchedule._id)
    .populate("parentId", "name email phone")
    .populate("childId", "name memberId")
    .populate("classId", "title startTime endTime");

  // Send instant confirmation notification to parent
  await sendWebPushNotification({
    userId: parentId,
    title: "Pickup/Drop-off Schedule Confirmed",
    body: `Schedule for ${child.name} on ${new Date(payload.scheduledDate!).toLocaleDateString()} has been created successfully.`,
    type: NotificationType.PICKUP_SCHEDULED,
    link: `/dashboard/pickup-dropoff/${newSchedule._id}`,
    metadata: { scheduleId: newSchedule._id },
  });

  return populatedSchedule;
};

const getAllSchedules = async (
  userId: string,
  userRole: string,
  query: Record<string, any>
) => {
  const filter: Record<string, any> = {};

  // Parents can only view their own schedules unless ADMIN/SUPER_ADMIN/COACH
  if (userRole !== Role.ADMIN && userRole !== Role.SUPER_ADMIN && userRole !== Role.COACH) {
    filter.parentId = userId;
  } else {
    if (query.parentId) filter.parentId = query.parentId;
  }

  if (query.childId) filter.childId = query.childId;
  if (query.status) filter.status = query.status;
  if (query.date) {
    const startOfDay = new Date(query.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(query.date);
    endOfDay.setHours(23, 59, 59, 999);
    filter.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
  }

  const schedules = await PickupDropoff.find(filter)
    .populate("parentId", "name email phone")
    .populate("childId", "name memberId picture")
    .populate("classId", "title startTime endTime room")
    .sort({ scheduledDate: 1, dropOffTime: 1 });

  return schedules;
};

const getSingleSchedule = async (id: string, userId: string, userRole: string) => {
  const schedule = await PickupDropoff.findById(id)
    .populate("parentId", "name email phone")
    .populate("childId", "name memberId picture")
    .populate("classId", "title startTime endTime room");

  if (!schedule) {
    throw new AppError(httpStatus.NOT_FOUND, "Schedule not found");
  }

  if (
    userRole !== Role.ADMIN &&
    userRole !== Role.SUPER_ADMIN &&
    userRole !== Role.COACH &&
    schedule.parentId.toString() !== userId
  ) {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied to this schedule");
  }

  return schedule;
};

const updateSchedule = async (
  id: string,
  userId: string,
  userRole: string,
  payload: Partial<IPickupDropoff>
) => {
  const schedule = await PickupDropoff.findById(id);
  if (!schedule) {
    throw new AppError(httpStatus.NOT_FOUND, "Schedule not found");
  }

  if (
    userRole !== Role.ADMIN &&
    userRole !== Role.SUPER_ADMIN &&
    schedule.parentId.toString() !== userId
  ) {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied to modify this schedule");
  }

  const updatedSchedule = await PickupDropoff.findByIdAndUpdate(
    id,
    {
      ...payload,
      scheduledDate: payload.scheduledDate ? new Date(payload.scheduledDate) : schedule.scheduledDate,
      dropOffTime: payload.dropOffTime ? new Date(payload.dropOffTime) : schedule.dropOffTime,
      pickUpTime: payload.pickUpTime ? new Date(payload.pickUpTime) : schedule.pickUpTime,
    },
    { new: true, runValidators: true }
  )
    .populate("parentId", "name email phone")
    .populate("childId", "name memberId");

  return updatedSchedule;
};

const updateStatus = async (
  id: string,
  userId: string,
  userRole: string,
  newStatus: PickupDropoffStatus
) => {
  const schedule = await PickupDropoff.findById(id).populate("childId", "name");
  if (!schedule) {
    throw new AppError(httpStatus.NOT_FOUND, "Schedule not found");
  }

  schedule.status = newStatus;
  await schedule.save();

  const childName = (schedule.childId as any)?.name || "Your child";

  let statusMessage = `Status updated to ${newStatus}`;
  if (newStatus === PickupDropoffStatus.DROPPED_OFF) {
    statusMessage = `${childName} has arrived and safely dropped off at the gym!`;
  } else if (newStatus === PickupDropoffStatus.READY_FOR_PICKUP) {
    statusMessage = `${childName}'s class is finished and is ready for pickup!`;
  } else if (newStatus === PickupDropoffStatus.COMPLETED) {
    statusMessage = `${childName} has been picked up successfully. Have a great day!`;
  }

  // Real-time Push Alert to Parent
  await sendWebPushNotification({
    userId: schedule.parentId,
    title: `Pickup/Drop-off Update: ${newStatus}`,
    body: statusMessage,
    type: NotificationType.STATUS_UPDATE,
    link: `/dashboard/pickup-dropoff/${schedule._id}`,
    metadata: { scheduleId: schedule._id, newStatus },
  });

  return schedule;
};

const deleteSchedule = async (id: string, userId: string, userRole: string) => {
  const schedule = await PickupDropoff.findById(id);
  if (!schedule) {
    throw new AppError(httpStatus.NOT_FOUND, "Schedule not found");
  }

  if (
    userRole !== Role.ADMIN &&
    userRole !== Role.SUPER_ADMIN &&
    schedule.parentId.toString() !== userId
  ) {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied to delete this schedule");
  }

  await PickupDropoff.findByIdAndDelete(id);
  return { message: "Schedule deleted successfully" };
};

export const PickupDropoffServices = {
  createSchedule,
  getAllSchedules,
  getSingleSchedule,
  updateSchedule,
  updateStatus,
  deleteSchedule,
};
