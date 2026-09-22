import httpStatus from "http-status-codes";
import Stripe from "stripe";
import mongoose from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { envVars } from "../../config/env";
import { User } from "../user/user.model";
import { Role, SubscriptionStatus } from "../user/user.interface";
import { MembershipPlan } from "../membershipPlan/membershipPlan.model";
import { UserMembership } from "../membership/membership.model";
import { MembershipStatus } from "../membership/membership.interface";

const stripe = new Stripe(envVars.STRIPE.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia" as any,
});

const extractIdString = (id: any): string => {
  if (!id) return "";
  if (typeof id === "string") return id;
  if (id._id) return id._id.toString();
  if (typeof id.toString === "function") return id.toString();
  return String(id);
};

const createSubscriptionCheckoutSession = async (
  loggedInUserId: string,
  planId: string,
  childId?: string
) => {
  const loggedInUser = await User.findById(loggedInUserId);
  if (!loggedInUser || loggedInUser.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  let targetUserId = loggedInUserId;

  if (loggedInUser.role === Role.PARENT && !childId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Parents cannot purchase a membership for themselves. Please select a child to purchase a membership for."
    );
  }

  if (childId) {
    const childUser = await User.findById(childId);
    if (!childUser || childUser.isDeleted) {
      throw new AppError(httpStatus.NOT_FOUND, "Child profile not found");
    }

    const childParentIdStr = extractIdString(childUser.parentId);
    const loggedInUserIdStr = extractIdString(loggedInUserId);

    if (
      loggedInUser.role === Role.PARENT ||
      loggedInUser.role === Role.USER ||
      loggedInUser.role === Role.MEMBER
    ) {
      if (!childParentIdStr) {
        childUser.parentId = loggedInUser._id;
        await childUser.save();
      } else if (childParentIdStr !== loggedInUserIdStr) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You can only purchase a membership for your own child"
        );
      }
    }
    targetUserId = childId;
  }

  const plan = await MembershipPlan.findById(planId);
  if (!plan || !plan.isActive) {
    throw new AppError(httpStatus.NOT_FOUND, "Membership plan not found or inactive");
  }

  // 1. Ensure Stripe Customer exists on current Stripe Account for the paying parent/user
  let customerId = loggedInUser.stripeCustomerId;
  if (customerId) {
    try {
      const existingCustomer = await stripe.customers.retrieve(customerId);
      if ((existingCustomer as any).deleted) {
        customerId = undefined;
      }
    } catch (err: any) {
      customerId = undefined;
    }
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: loggedInUser.email,
      name: loggedInUser.name,
      metadata: {
        userId: loggedInUser._id.toString(),
      },
    });
    customerId = customer.id;
    loggedInUser.stripeCustomerId = customerId;
    await loggedInUser.save();
  }

  // 2. Ensure Stripe Product and Recurring Price exist on current Stripe Account
  let priceId = plan.stripePriceId;
  if (priceId) {
    try {
      const existingPrice = await stripe.prices.retrieve(priceId);
      if (!existingPrice.active) {
        priceId = undefined;
      }
    } catch (err: any) {
      priceId = undefined;
    }
  }

  if (!priceId) {
    const product = await stripe.products.create({
      name: `Palestra Membership - ${plan.title}`,
      description: `${plan.title} plan membership with monthly class limit of ${plan.monthlyClassLimit}`,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(plan.price * 100), // Price in cents
      currency: "usd",
      recurring: {
        interval: "month",
      },
    });

    plan.stripeProductId = product.id;
    plan.stripePriceId = price.id;
    await plan.save();
    priceId = price.id;
  }

  const routePrefix = loggedInUser.role === Role.PARENT ? "parent" : "member";
  const successUrl = `${envVars.FRONTEND_URL}/${routePrefix}/payment-success`;
  const cancelUrl = `${envVars.FRONTEND_URL}/${routePrefix}/payment-failed`;

  // 3. Create Stripe Checkout Session in subscription mode
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId: targetUserId,
      planId: plan._id.toString(),
      payerId: loggedInUser._id.toString(),
    },
    subscription_data: {
      metadata: {
        userId: targetUserId,
        planId: plan._id.toString(),
        payerId: loggedInUser._id.toString(),
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  };
};

const activateUserMembershipFromSession = async (session: Stripe.Checkout.Session) => {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;

  if (!userId || !planId) return null;

  const user = await User.findById(userId);
  const plan = await MembershipPlan.findById(planId);

  if (!user || !plan) return null;

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  user.stripeCustomerId = session.customer as string;
  user.stripeSubscriptionId = session.subscription as string;
  user.subscriptionStatus = SubscriptionStatus.ACTIVE;
  user.subscriptionStartDate = startDate;
  user.subscriptionEndDate = endDate;
  user.currentPlan = plan._id as mongoose.Types.ObjectId;
  await user.save();

  let userMembership = await UserMembership.findOne({ userId: user._id });
  if (userMembership) {
    userMembership.currentPlanId = plan._id as mongoose.Types.ObjectId;
    userMembership.status = MembershipStatus.ACTIVE;
    userMembership.startDate = startDate;
    userMembership.expiryDate = endDate;
    userMembership.classesUsedThisMonth = 0;
    userMembership.lastAllowanceResetDate = startDate;
    userMembership.pendingPlanId = null;
    userMembership.noticeRequestedDate = null;
    userMembership.pendingEffectiveDate = null;
    await userMembership.save();
  } else {
    userMembership = await UserMembership.create({
      userId: user._id,
      currentPlanId: plan._id,
      status: MembershipStatus.ACTIVE,
      startDate,
      expiryDate: endDate,
      classesUsedThisMonth: 0,
      lastAllowanceResetDate: startDate,
    });
  }

  return { user, userMembership };
};

const verifySession = async (sessionId: string) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status === "paid" || session.status === "complete") {
    const result = await activateUserMembershipFromSession(session);
    if (result) {
      return result;
    }
  }

  throw new AppError(httpStatus.BAD_REQUEST, "Payment not completed or invalid session");
};

const handleStripeWebhook = async (rawBody: Buffer, signature: string) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      envVars.STRIPE.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Stripe Webhook Signature Verification Failed: ${err.message}`
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await activateUserMembershipFromSession(session);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as any;
      const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

      if (subscriptionId || customerId) {
        const user = await User.findOne({
          $or: [
            { stripeSubscriptionId: subscriptionId },
            { stripeCustomerId: customerId },
          ],
        });

        if (user) {
          const startDate = new Date();
          const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

          user.subscriptionStatus = SubscriptionStatus.ACTIVE;
          user.subscriptionStartDate = startDate;
          user.subscriptionEndDate = endDate;
          await user.save();

          const userMembership = await UserMembership.findOne({ userId: user._id });
          if (userMembership) {
            userMembership.status = MembershipStatus.ACTIVE;
            userMembership.expiryDate = endDate;
            userMembership.classesUsedThisMonth = 0;
            userMembership.lastAllowanceResetDate = startDate;
            await userMembership.save();
          }
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      if (customerId) {
        const user = await User.findOne({ stripeCustomerId: customerId });
        if (user) {
          user.subscriptionStatus = SubscriptionStatus.INACTIVE;
          await user.save();
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;

      const user = await User.findOne({ stripeSubscriptionId: subscriptionId });
      if (user) {
        user.subscriptionStatus = SubscriptionStatus.CANCELED;
        await user.save();

        const userMembership = await UserMembership.findOne({ userId: user._id });
        if (userMembership) {
          userMembership.status = MembershipStatus.CANCELLED;
          await userMembership.save();
        }
      }
      break;
    }

    default:
      break;
  }

  return { received: true };
};

const cancelSubscription = async (loggedInUserId: string, childId?: string) => {
  const loggedInUser = await User.findById(loggedInUserId);
  if (!loggedInUser || loggedInUser.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  let targetUserId = loggedInUserId;

  if (loggedInUser.role === Role.PARENT && !childId) {
    const children = await User.find({ parentId: loggedInUser._id, isDeleted: { $ne: true } });
    if (children.length > 0) {
      targetUserId = children[0]._id.toString();
    }
  } else if (childId) {
    const childUser = await User.findById(childId);
    if (!childUser || childUser.isDeleted) {
      throw new AppError(httpStatus.NOT_FOUND, "Child profile not found");
    }
    const childParentIdStr = extractIdString(childUser.parentId);
    const loggedInUserIdStr = extractIdString(loggedInUserId);
    if (childParentIdStr && childParentIdStr !== loggedInUserIdStr) {
      throw new AppError(httpStatus.FORBIDDEN, "You can only cancel membership for your own child");
    }
    targetUserId = childId;
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new AppError(httpStatus.NOT_FOUND, "Target user profile not found");
  }

  if (targetUser.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(targetUser.stripeSubscriptionId);
    } catch (err: any) {
      // Ignore if already canceled on Stripe
    }
  }

  targetUser.subscriptionStatus = SubscriptionStatus.CANCELED;
  await targetUser.save();

  const userMembership = await UserMembership.findOne({ userId: targetUser._id });
  if (userMembership) {
    userMembership.status = MembershipStatus.CANCELLED;
    await userMembership.save();
  }

  return {
    success: true,
    message: "Subscription successfully canceled",
  };
};

export const PaymentServices = {
  createSubscriptionCheckoutSession,
  verifySession,
  handleStripeWebhook,
  cancelSubscription,
};
