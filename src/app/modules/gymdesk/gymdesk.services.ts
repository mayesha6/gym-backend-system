import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { SubscriptionStatus } from "../user/user.interface";
import { UserMembership } from "../membership/membership.model";
import { MembershipStatus } from "../membership/membership.interface";
import { MembershipPlan } from "../membershipPlan/membershipPlan.model";
import { IGymdeskWebhookPayload } from "./gymdesk.interface";
import mongoose from "mongoose";

const processWebhook = async (payload: IGymdeskWebhookPayload) => {
  // Extract details from payload (flexible to handle direct payload or nested data object)
  const memberData = payload.member || payload.data?.member || {};
  const subscriptionData = payload.subscription || payload.data?.subscription || {};
  
  const email = payload.email || memberData.email || payload.data?.email;
  const gymdeskMemberId = memberData.id || memberData.member_id || payload.member_id;
  const event = (payload.event || payload.type || "payment.success").toLowerCase();

  if (!email && !gymdeskMemberId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid webhook payload: Missing member email or Gymdesk member ID"
    );
  }

  // Find user in DB
  let user = null;
  if (email) {
    user = await User.findOne({ email: email.toLowerCase() });
  }
  if (!user && gymdeskMemberId) {
    user = await User.findOne({ gymdeskMemberId });
  }

  if (!user) {
    // Return informative response if user is not found locally yet
    return {
      success: false,
      message: `User not found for email: ${email || "N/A"} or Gymdesk ID: ${gymdeskMemberId || "N/A"}`
    };
  }

  // Determine subscription status based on event / payload status
  let status: SubscriptionStatus = SubscriptionStatus.ACTIVE;
  let membershipStatus: MembershipStatus = MembershipStatus.ACTIVE;

  if (
    event.includes("cancel") ||
    subscriptionData.status === "canceled" ||
    payload.status === "canceled"
  ) {
    status = SubscriptionStatus.CANCELED;
    membershipStatus = MembershipStatus.CANCELLED;
  } else if (
    event.includes("expire") ||
    event.includes("fail") ||
    subscriptionData.status === "expired"
  ) {
    status = SubscriptionStatus.EXPIRED;
    membershipStatus = MembershipStatus.CANCELLED;
  } else {
    status = SubscriptionStatus.ACTIVE;
    membershipStatus = MembershipStatus.ACTIVE;
  }

  // Handle plan matching if plan info provided
  const planIdOrName = subscriptionData.plan_id || subscriptionData.plan_name;
  let matchedPlan = null;
  if (planIdOrName) {
    matchedPlan = await MembershipPlan.findOne({
      $or: [
        { gymdeskPlanId: planIdOrName },
        { title: { $regex: new RegExp(`^${planIdOrName}$`, "i") } }
      ]
    });
  }

  // Calculate start & end dates
  const startDate = subscriptionData.start_date
    ? new Date(subscriptionData.start_date)
    : new Date();
  
  const endDate = subscriptionData.end_date || subscriptionData.next_billing_date
    ? new Date(subscriptionData.end_date || subscriptionData.next_billing_date!)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // default 30 days

  // Update User record
  user.gymdeskMemberId = gymdeskMemberId || user.gymdeskMemberId;
  user.subscriptionStatus = status;
  user.subscriptionStartDate = startDate;
  user.subscriptionEndDate = endDate;
  if (matchedPlan) {
    user.currentPlan = matchedPlan._id as mongoose.Types.ObjectId;
  }
  await user.save();

  // Update or Create UserMembership record
  let userMembership = await UserMembership.findOne({ userId: user._id });
  if (userMembership) {
    userMembership.status = membershipStatus;
    userMembership.expiryDate = endDate;
    if (matchedPlan) {
      userMembership.currentPlanId = matchedPlan._id as mongoose.Types.ObjectId;
    }
    await userMembership.save();
  } else {
    let defaultPlanId = matchedPlan?._id;
    if (!defaultPlanId) {
      const defaultPlan = await MembershipPlan.findOne({ isActive: true }).sort({ price: 1 });
      defaultPlanId = defaultPlan?._id;
    }

    if (defaultPlanId) {
      await UserMembership.create({
        userId: user._id,
        currentPlanId: defaultPlanId,
        status: membershipStatus,
        startDate,
        expiryDate: endDate,
        classesUsedThisMonth: 0,
        lastAllowanceResetDate: new Date()
      });
    }
  }

  return {
    success: true,
    message: `Subscription successfully updated to ${status} for user ${user.email}`,
    user: {
      id: user._id,
      email: user.email,
      subscriptionStatus: user.subscriptionStatus,
      gymdeskMemberId: user.gymdeskMemberId
    }
  };
};

const getCheckoutUrl = async (userId: string, planId?: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const baseUrl = "https://palestra.gymdesk.com/signup";
  const url = new URL(baseUrl);

  // Pre-fill parameters
  if (user.email) url.searchParams.append("email", user.email);
  if (user.name) url.searchParams.append("name", user.name);

  if (planId) {
    const plan = await MembershipPlan.findById(planId);
    if (plan && plan.gymdeskPlanId) {
      url.searchParams.append("plan", plan.gymdeskPlanId);
    }
  }

  return {
    checkoutUrl: url.toString(),
    userEmail: user.email
  };
};

export const GymdeskServices = {
  processWebhook,
  getCheckoutUrl
};
