import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { MembershipPlan } from "../membershipPlan/membershipPlan.model";
import { User } from "../user/user.model";
import { Role, SubscriptionStatus } from "../user/user.interface";
import { MembershipStatus } from "./membership.interface";
import { UserMembership } from "./membership.model";
import mongoose from "mongoose";

const extractIdString = (id: any): string => {
  if (!id) return "";
  if (typeof id === "string") return id;
  if (id._id) return id._id.toString();
  if (typeof id.toString === "function") return id.toString();
  return String(id);
};

const getMyMembership = async (userId: string, childId?: string) => {
  const loggedInUser = await User.findById(userId);
  let targetUserId = userId;

  if (childId) {
    const childUser = await User.findById(childId);
    if (!childUser || childUser.isDeleted) {
      throw new AppError(httpStatus.NOT_FOUND, "Child profile not found");
    }

    const childParentIdStr = extractIdString(childUser.parentId);
    if (childParentIdStr && childParentIdStr !== userId) {
      throw new AppError(httpStatus.FORBIDDEN, "You can only view membership for your own child");
    }
    targetUserId = childId;
  } else if (loggedInUser?.role === Role.PARENT) {
    const children = await User.find({ parentId: userId, isDeleted: { $ne: true } });
    if (children.length > 0) {
      targetUserId = children[0]._id.toString();
    }
  }

  let membership = await UserMembership.findOne({ userId: targetUserId })
    .populate("currentPlanId")
    .populate("pendingPlanId");

  if (!membership) {
    const user = await User.findById(targetUserId);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.subscriptionStatus === SubscriptionStatus.ACTIVE && user.currentPlan) {
      const expiryDate = user.subscriptionEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      membership = await UserMembership.create({
        userId: new mongoose.Types.ObjectId(targetUserId),
        currentPlanId: user.currentPlan,
        status: MembershipStatus.ACTIVE,
        startDate: user.subscriptionStartDate || new Date(),
        expiryDate,
        classesUsedThisMonth: 0,
        lastAllowanceResetDate: new Date(),
      });
      membership = await membership.populate("currentPlanId");
    } else {
      membership = await UserMembership.create({
        userId: new mongoose.Types.ObjectId(targetUserId),
        currentPlanId: null as any,
        status: MembershipStatus.CANCELLED,
        startDate: new Date(),
        expiryDate: new Date(),
        classesUsedThisMonth: 0,
        lastAllowanceResetDate: new Date(),
      });
    }
  }

  return membership;
};

const requestPlanChange = async (userId: string, targetPlanId: string, childId?: string) => {
  const currentMembership = await getMyMembership(userId, childId);
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
    await User.findByIdAndUpdate(currentMembership.userId, { currentPlan: targetPlan._id });

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

const requestCancellation = async (userId: string, childId?: string) => {
  const currentMembership = await getMyMembership(userId, childId);

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
