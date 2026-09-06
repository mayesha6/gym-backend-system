import httpStatus from "http-status-codes";
import Stripe from "stripe";
import mongoose from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { envVars } from "../../config/env";
import { User } from "../user/user.model";
import { SubscriptionStatus } from "../user/user.interface";
import { MembershipPlan } from "../membershipPlan/membershipPlan.model";
import { UserMembership } from "../membership/membership.model";
import { MembershipStatus } from "../membership/membership.interface";

const stripe = new Stripe(envVars.STRIPE.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia" as any,
});

const createSubscriptionCheckoutSession = async (userId: string, planId: string) => {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const plan = await MembershipPlan.findById(planId);
  if (!plan || !plan.isActive) {
    throw new AppError(httpStatus.NOT_FOUND, "Membership plan not found or inactive");
  }

  // 1. Ensure Stripe Customer exists on current Stripe Account
  let customerId = user.stripeCustomerId;
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
      email: user.email,
      name: user.name,
      metadata: {
        userId: user._id.toString(),
      },
    });
    customerId = customer.id;
    user.stripeCustomerId = customerId;
    await user.save();
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

  const successUrl = `${envVars.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&payment_status=success`;
  const cancelUrl = `${envVars.FRONTEND_URL}/membership-plans?payment_status=canceled`;

  // 3. Create Stripe Checkout Session in subscription mode (saves card for auto-debit)
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
      userId: user._id.toString(),
      planId: plan._id.toString(),
    },
    subscription_data: {
      metadata: {
        userId: user._id.toString(),
        planId: plan._id.toString(),
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

const cancelSubscription = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    } catch (err: any) {
      // Ignore if already canceled on Stripe
    }
  }

  user.subscriptionStatus = SubscriptionStatus.CANCELED;
  await user.save();

  const userMembership = await UserMembership.findOne({ userId: user._id });
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
