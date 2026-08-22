import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { IMembershipPlan } from "./membershipPlan.interface";
import { MembershipPlan } from "./membershipPlan.model";

const createPlan = async (payload: IMembershipPlan) => {
  const existingPlan = await MembershipPlan.findOne({ title: payload.title });
  if (existingPlan) {
    throw new AppError(httpStatus.BAD_REQUEST, "Plan with this title already exists");
  }
  const plan = await MembershipPlan.create(payload);
  return plan;
};

const getAllPlans = async () => {
  const plans = await MembershipPlan.find({ isActive: true }).sort({ price: 1 });
  return plans;
};

const getSinglePlan = async (id: string) => {
  const plan = await MembershipPlan.findById(id);
  if (!plan) {
    throw new AppError(httpStatus.NOT_FOUND, "Plan not found");
  }
  return plan;
};

const updatePlan = async (id: string, payload: Partial<IMembershipPlan>) => {
  const plan = await MembershipPlan.findById(id);
  if (!plan) {
    throw new AppError(httpStatus.NOT_FOUND, "Plan not found");
  }
  const updatedPlan = await MembershipPlan.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  return updatedPlan;
};

const deletePlan = async (id: string) => {
  const plan = await MembershipPlan.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  if (!plan) {
    throw new AppError(httpStatus.NOT_FOUND, "Plan not found");
  }
  return plan;
};

export const MembershipPlanServices = {
  createPlan,
  getAllPlans,
  getSinglePlan,
  updatePlan,
  deletePlan,
};
