import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { MembershipPlan } from "../membershipPlan/membershipPlan.model";
import { User } from "../user/user.model";
import { MembershipStatus } from "./membership.interface";
import { UserMembership } from "./membership.model";
import mongoose from "mongoose";

const getMyMembership = async (userId: string) => {
  let membership = await UserMembership.findOne({ userId })
    .populate("currentPlanId")
    .populate("pendingPlanId");

  if (!membership) {
    // If no explicit subscription record exists yet, check if User has a currentPlan assigned
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    let defaultPlan = await MembershipPlan.findOne({ isActive: true }).sort({ price: 1 });
    if (!defaultPlan) {
      defaultPlan = await MembershipPlan.create({
        title: "Basic",
        price: 49,
        monthlyClassLimit: 4,
        bookingWindowHours: 24,
        features: ["Group Classes"],
      });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    membership = await UserMembership.create({
      userId: new mongoose.Types.ObjectId(userId),
      currentPlanId: defaultPlan._id,
      status: MembershipStatus.ACTIVE,
      startDate: new Date(),
      expiryDate,
      classesUsedThisMonth: 0,
      lastAllowanceResetDate: new Date(),
    });

    await User.findByIdAndUpdate(userId, { currentPlan: defaultPlan._id });
    membership = await membership.populate("currentPlanId");
  }

  return membership;
};

const requestPlanChange = async (userId: string, targetPlanId: string) => {
  const currentMembership = await getMyMembership(userId);
  const targetPlan = await MembershipPlan.findById(targetPlanId);
  if (!targetPlan || !targetPlan.isActive) {
    throw new AppError(httpStatus.NOT_FOUND, "Target membership plan not found");
  }

  const currentPlan = await MembershipPlan.findById(currentMembership.currentPlanId);
  const currentPrice = currentPlan ? currentPlan.price : 0;

  // If Upgrade (target price >= current price) -> Instant Switch
  if (targetPlan.price >= currentPrice) {
    currentMembership.currentPlanId = targetPlan._id as any;
    currentMembership.status = MembershipStatus.ACTIVE;
    currentMembership.pendingPlanId = null;
    currentMembership.noticeRequestedDate = null;
    currentMembership.pendingEffectiveDate = null;

    await currentMembership.save();
    await User.findByIdAndUpdate(userId, { currentPlan: targetPlan._id });

    return {
      type: "UPGRADE",
      message: "Membership upgraded successfully!",
      membership: await currentMembership.populate("currentPlanId"),
    };
  } else {
    // If Downgrade (target price < current price) -> 30-Day Notice Queue
    const noticeRequestedDate = new Date();
    const pendingEffectiveDate = new Date();
    pendingEffectiveDate.setDate(pendingEffectiveDate.getDate() + 30);

    currentMembership.status = MembershipStatus.PENDING_CHANGE;
    currentMembership.pendingPlanId = targetPlan._id as any;
    currentMembership.noticeRequestedDate = noticeRequestedDate;
    currentMembership.pendingEffectiveDate = pendingEffectiveDate;

    await currentMembership.save();

    return {
      type: "DOWNGRADE",
      message: "Downgrade request scheduled with a 30-day notice period.",
      noticeRequestedDate,
      pendingEffectiveDate,
      membership: await currentMembership.populate(["currentPlanId", "pendingPlanId"]),
    };
  }
};

const requestCancellation = async (userId: string) => {
  const currentMembership = await getMyMembership(userId);

  const noticeRequestedDate = new Date();
  const pendingEffectiveDate = new Date();
  pendingEffectiveDate.setDate(pendingEffectiveDate.getDate() + 30);

  currentMembership.status = MembershipStatus.PENDING_CHANGE;
  currentMembership.pendingPlanId = null; // null means cancellation
  currentMembership.noticeRequestedDate = noticeRequestedDate;
  currentMembership.pendingEffectiveDate = pendingEffectiveDate;

  await currentMembership.save();

  return {
    type: "CANCELLATION",
    message: "Cancellation request scheduled with a 30-day notice period.",
    noticeRequestedDate,
    pendingEffectiveDate,
    membership: await currentMembership.populate("currentPlanId"),
  };
};

const processPendingNoticeQueue = async () => {
  const now = new Date();
  const pendingMemberships = await UserMembership.find({
    status: MembershipStatus.PENDING_CHANGE,
    pendingEffectiveDate: { $lte: now },
  });

  for (const membership of pendingMemberships) {
    if (membership.pendingPlanId) {
      // Execute downgrade switch
      membership.currentPlanId = membership.pendingPlanId;
      membership.status = MembershipStatus.ACTIVE;
      membership.pendingPlanId = null;
      membership.noticeRequestedDate = null;
      membership.pendingEffectiveDate = null;
      await membership.save();
      await User.findByIdAndUpdate(membership.userId, { currentPlan: membership.currentPlanId });
    } else {
      // Execute cancellation
      membership.status = MembershipStatus.CANCELLED;
      membership.noticeRequestedDate = null;
      membership.pendingEffectiveDate = null;
      await membership.save();
    }
  }

  return pendingMemberships.length;
};

export const MembershipServices = {
  getMyMembership,
  requestPlanChange,
  requestCancellation,
  processPendingNoticeQueue,
};
