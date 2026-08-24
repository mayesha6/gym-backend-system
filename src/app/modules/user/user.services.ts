import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { IsActive, IUser, Role } from "./user.interface";
import { User } from "./user.model";
import { QueryBuilder } from "../../utils/QueryBuiler";
import bcryptjs from 'bcryptjs';

const generateMemberId = async (): Promise<string> => {
  const lastUser = await User.findOne({ memberId: { $regex: /^PC-/ } }).sort({ createdAt: -1 });
  let nextNumber = 129;
  if (lastUser && lastUser.memberId) {
    const parts = lastUser.memberId.split("-");
    if (parts.length > 1 && !isNaN(Number(parts[1]))) {
      nextNumber = Number(parts[1]) + 1;
    }
  }
  return `PC-${String(nextNumber).padStart(5, '0')}`;
};

const createUser = async (payload: Partial<IUser>) => {
  const isUserExist = await User.findOne({ email: payload.email });
  if (isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User with this email already exists");
  }

  if (payload.password) {
    payload.password = await bcryptjs.hash(payload.password, 10);
  }

  const user = await User.create({
    ...payload,
    role: payload.role || Role.MEMBER,
    isActive: payload.isActive || IsActive.ACTIVE
  });

  return user;
};

const addMember = async (
  payload: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role?: Role;
    membershipPlan?: string;
    startDate?: string;
    expireDate?: string;
    status?: IsActive;
    emergencyContact?: any;
  },
  creatorRole?: Role
) => {
  const targetRole = payload.role || Role.MEMBER;

  // Permission check: Only SUPER_ADMIN can create ADMIN or SUPER_ADMIN accounts.
  if (
    (targetRole === Role.ADMIN || targetRole === Role.SUPER_ADMIN) &&
    creatorRole !== Role.SUPER_ADMIN
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Only Super Admin can create Admin or Super Admin accounts."
    );
  }

  const isUserExist = await User.findOne({ email: payload.email });
  if (isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User with this email already exists");
  }

  const memberId = await generateMemberId();
  const rawPassword = payload.password || `Palestra@${Math.floor(1000 + Math.random() * 9000)}`;
  const hashedPassword = await bcryptjs.hash(rawPassword, 10);

  const user = await User.create({
    memberId,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    password: hashedPassword,
    role: targetRole,
    isActive: payload.status || IsActive.ACTIVE,
    isVerified: true,
    joinDate: payload.startDate ? new Date(payload.startDate) : new Date(),
    emergencyContact: payload.emergencyContact,
    currentPlan: payload.membershipPlan ? payload.membershipPlan as any : undefined,
  });

  return {
    user,
    credentials: {
      email: payload.email,
      password: rawPassword,
      memberId
    }
  };
};

const getAllUsers = async (query: Record<string, any>) => {
  const userSearchableFields = ["name", "email", "phone", "memberId"];
  const userQuery = new QueryBuilder(
    User.find({ isDeleted: { $ne: true } }).populate("currentPlan"),
    query
  )
    .search(userSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await userQuery.modelQuery;
  const meta = await userQuery.getMeta();

  return {
    meta,
    result,
  };
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId).populate("currentPlan");
  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }
  return user;
};

const getSingleUser = async (id: string) => {
  const user = await User.findById(id).populate("currentPlan");
  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }
  return user;
};

const updateUser = async (id: string, payload: Partial<IUser>) => {
  const user = await User.findById(id);
  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (payload.password) {
    payload.password = await bcryptjs.hash(payload.password, 10);
  }

  const updatedUser = await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return updatedUser;
};

const updateMyProfile = async (userId: string, payload: Partial<IUser>) => {
  return updateUser(userId, payload);
};

const deleteOwnAccount = async (userId: string) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isDeleted: true, isActive: IsActive.INACTIVE },
    { new: true }
  );
  return user;
};

const deleteUserById = async (id: string) => {
  const user = await User.findByIdAndUpdate(
    id,
    { isDeleted: true, isActive: IsActive.INACTIVE },
    { new: true }
  );
  return user;
};

const deleteAllUsers = async () => {
  const result = await User.updateMany({}, { isDeleted: true });
  return result;
};

export const UserServices = {
  createUser,
  addMember,
  getAllUsers,
  getMe,
  getSingleUser,
  updateUser,
  updateMyProfile,
  deleteOwnAccount,
  deleteUserById,
  deleteAllUsers,
};
