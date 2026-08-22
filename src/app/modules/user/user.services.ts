
import httpStatus from "http-status-codes";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { AccountStatus, AccountType, IUser, Role } from "./user.interface";
import { User } from "./user.model";
import { userFilterableFields, userSearchableFields } from "./user.constant";
import { QueryBuilder } from "../../utils/QueryBuiler";
import { JwtPayload } from "jsonwebtoken";
import bcryptjs from 'bcryptjs';
import { deleteFileFromS3 } from "../../config/S3Client.config";
import { generateOtp } from "../otp/otp.service";
import { sendEmail } from "../../utils/sendEmail";
import { redisClient } from "../../config/redis.config";
import { getCurrentQuarter } from "../../utils/wallet";
import { Wallet } from "../wallet/wallet.model";
import { SubscriptionStatus } from "../subscription/subscription.interface";
import { Subscription } from "../subscription/subscription.model";
import { Plan } from "../plan/plan.model";
import mongoose from "mongoose";
import { Notification } from "../notification/notification.model";
import { NotificationType } from "../notification/notification.interface";

const createUser = async (payload: Partial<IUser>, creatorToken?: JwtPayload) => {
  const session = await mongoose.startSession();
  let user: any;
  let wallet: any;
  let isSelfOrgRegistration = false;
  let trialPlanId = null;

  try {
    session.startTransaction();

    const { email, password, accountType, department, ...rest } = payload;

    const isUserExist = await User.findOne({ email }).session(session);
    if (isUserExist) {
      throw new AppError(httpStatus.BAD_REQUEST, "User Already Exist");
    }

    let role = Role.USER;
    let organizationId = null;
    let assignedDepartment = department || (accountType === AccountType.ORGANIZATION ? "Organization" : "Personal Account");

    isSelfOrgRegistration = accountType === AccountType.ORGANIZATION && !creatorToken;

    if (isSelfOrgRegistration) {
      role = Role.ORGANIZATION_ADMIN;
    }

    // ==========================================
    // 🔥 SUBSCRIPTION & USER LIMIT CHECK
    // ==========================================
    if (creatorToken) {
      if (creatorToken.role === Role.SUPER_ADMIN) {
        role = payload.role || Role.SUPER_ADMIN;
        organizationId = payload.organizationId || null;
        assignedDepartment = department || "Personal Account";
      } else {
        if (creatorToken.role === Role.ORGANIZATION_ADMIN) {
          organizationId = creatorToken.userId;
          if (payload.role === Role.DEPARTMENT_ADMIN) {
            role = Role.DEPARTMENT_ADMIN;
          }
        } else if (creatorToken.role === Role.DEPARTMENT_ADMIN) {
          organizationId = creatorToken.organizationId;
          assignedDepartment = creatorToken.department;
          role = Role.USER; 
        }

        const rootOrgAdmin = await User.findById(organizationId).populate("currentPlan").session(session);

        if (!rootOrgAdmin) {
          throw new AppError(httpStatus.NOT_FOUND, "Organization Admin not found");
        }

        // ১. সাবস্ক্রিপশন অ্যাক্টিভ আছে কি না চেক করা
        if (
          rootOrgAdmin.subscriptionStatus !== SubscriptionStatus.ACTIVE &&
          rootOrgAdmin.subscriptionStatus !== SubscriptionStatus.TRIAL
        ) {
          throw new AppError(httpStatus.FORBIDDEN, "Organization subscription is not active. Please upgrade your plan.");
        }

        // Dynamic trial expiration validation
        if (rootOrgAdmin.subscriptionStatus === SubscriptionStatus.TRIAL) {
          const sub = await Subscription.findOne({ user: organizationId, status: SubscriptionStatus.TRIAL }).session(session);
          if (sub && sub.trialEnd && new Date() > new Date(sub.trialEnd)) {
            await User.findByIdAndUpdate(organizationId, { subscriptionStatus: SubscriptionStatus.EXPIRED }).session(session);
            await Subscription.findByIdAndUpdate(sub._id, { status: SubscriptionStatus.EXPIRED }).session(session);
            throw new AppError(httpStatus.FORBIDDEN, "Organization trial subscription has expired. Please upgrade your plan.");
          }
        }

        // ২. প্ল্যান লিমিট চেক করা
        const plan = rootOrgAdmin.currentPlan as any; 
        if (!plan || !plan.userLimit) {
          throw new AppError(httpStatus.BAD_REQUEST, "Active plan details not found");
        }

        const currentUserCount = await User.countDocuments({ 
          organizationId, 
          isDeleted: false 
        }).session(session);

        if (currentUserCount >= plan.userLimit) {
          throw new AppError(
            httpStatus.FORBIDDEN, 
            `User limit reached! Your plan allows up to ${plan.userLimit} users.`
          );
        }
      }
    }

    // ==========================================
    // 🚀 PLAN PROVISIONING (FOR NEW ORGANIZATIONS)
    // ==========================================
    if (isSelfOrgRegistration) {
      let trialPlan = await Plan.findOne({ name: "Free Trial" }).session(session);
      if (!trialPlan) {
        const createdPlans = await Plan.create([
          {
            name: "Free Trial",
            price: 0,
            currency: "USD",
            interval: "MONTH",
            userLimit: 5,
            allocatedPoints: 0,
            features: ["Basic recognition", "Department tracking"],
            isActive: true,
            stripeProductId: null,
            stripePriceId: null
          }
        ], { session });
        trialPlan = createdPlans[0];
      }
      trialPlanId = trialPlan._id;
    }

    // ==========================================
    // 🚀 USER CREATION
    // ==========================================
    const hashedPassword = await bcryptjs.hash(
      password as string,
      Number(envVars.BCRYPT_SALT_ROUND)
    );

    const status = isSelfOrgRegistration 
      ? AccountStatus.PENDING 
      : AccountStatus.APPROVED;

    const userArray = await User.create([
      {
        email,
        password: hashedPassword,
        accountType: organizationId ? AccountType.INDIVIDUAL : accountType,
        role,
        status,
        department: assignedDepartment,
        organizationId,
        createdBy: creatorToken ? creatorToken.userId : null,
        subscriptionStatus: isSelfOrgRegistration ? SubscriptionStatus.TRIAL : null,
        currentPlan: trialPlanId,
        ...rest,
      }
    ], { session });

    user = userArray[0];

    // ==========================================
    // 🚀 SUBSCRIPTION PROVISIONING (7 DAYS TRIAL)
    // ==========================================
    if (isSelfOrgRegistration) {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);

      await Subscription.create([
        {
          user: user._id,
          plan: trialPlanId,
          status: SubscriptionStatus.TRIAL,
          trialEnd: trialEndDate,
          currentPeriodEnd: trialEndDate,
        }
      ], { session });
    }

    const { quarter, year } = getCurrentQuarter();

    const walletArray = await Wallet.create([
      {
        user: user._id,
        organizationId: user.organizationId || user._id,
        quarter,
        year,
        pointsAllocated: 0,
        pointsBalance: 0
      }
    ], { session });

    wallet = walletArray[0];

    // ==========================================
    // 🔔 NOTIFICATION FOR ALL ACTIVE SUPER ADMINS
    // ==========================================
    if (isSelfOrgRegistration) {
      const superAdmins = await User.find({ role: Role.SUPER_ADMIN, isDeleted: false }).session(session);
      if (superAdmins.length > 0) {
        const notificationsPayload = superAdmins.map(admin => ({
          recipient: admin._id,
          title: "New Organization Registration",
          message: `A new organization "${user.name}" has registered and is waiting for approval.`,
          type: NotificationType.SYSTEM,
          isRead: false,
          link: "/super-admin/organizations",
        }));
        await Notification.create(notificationsPayload, { session, ordered: true });
      }
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  // ==========================================
  // 📧 EMAILS & OTP (OUTSIDE TRANSACTION)
  // ==========================================
  if (isSelfOrgRegistration) {
    User.find({ role: Role.SUPER_ADMIN, isDeleted: false }).then(superAdmins => {
      superAdmins.forEach(admin => {
        sendEmail({
          to: admin.email, 
          subject: `New Organization Registration - ${user.name}`,
          templateName: "organizationRequest",
          templateData: {
            applicantName: user.name,
            applicantEmail: user.email,
            department: user.department,
            senderName: "System Notification"
          },
        }).catch(err => console.error(`SMTP Org notification failed for ${admin.email}:`, err));
      });
    }).catch(err => console.error("Failed to query super admins for email notifications:", err));
  }

  const redisKey = `otp:${user.email}`;
  const otp = generateOtp();

  await redisClient.set(redisKey, otp, {
    expiration: { type: "EX", value: 120 },
  });

  await sendEmail({
    to: user.email,
    subject: "Account Verification OTP",
    templateName: "otp",
    templateData: {
      name: user.name,
      otp,
    },
  });

  return { wallet, user };
};

const getAllUsers = async (
  query: Record<string, string>,
  decodedToken: JwtPayload
) => {
  const filter: any = {};

  // =====================================
  // 🔐 STRICT ROLE BASED DATA ISOLATION
  // =====================================

  // 1. SUPER_ADMIN: সব দেখতে পারবে, তবে চাইলে নির্দিষ্ট organization ফিল্টার করতে পারবে
  if (decodedToken.role === Role.SUPER_ADMIN) {
    if (query.organizationId === "null") {
      filter.organizationId = null;
      filter.accountType = AccountType.INDIVIDUAL;
      // For global user management, super admin only wants to see SUPER_ADMIN and USER roles by default
      if (!query.role) {
        filter.role = { $in: [Role.SUPER_ADMIN, Role.USER] };
      }
    } else if (query.organizationId) {
      filter.organizationId = query.organizationId;
    }
  }

  // 2. ORGANIZATION_ADMIN: শুধুমাত্র নিজের অর্গানাইজেশনের ইউজার এবং DA দেখতে পারবে
  if (decodedToken.role === Role.ORGANIZATION_ADMIN) {
    filter.organizationId = decodedToken.userId; 
  }

  // 3. DEPARTMENT_ADMIN: নিজের অর্গানাইজেশনের এবং শুধুমাত্র নিজের ডিপার্টমেন্টের ইউজারদের দেখতে পারবে
  if (decodedToken.role === Role.DEPARTMENT_ADMIN) {
    filter.organizationId = decodedToken.organizationId;
    filter.department = decodedToken.department;
    filter._id = { $ne: decodedToken.userId };
  }

  // 4. REGULAR USER: নিজের অর্গানাইজেশনের অন্য ইউজারদের দেখতে পারবে
  if (decodedToken.role === Role.USER) {
    filter.organizationId = decodedToken.organizationId;
    filter.role = Role.USER; // সাধারণ ইউজারদের Admin দের দেখার দরকার নেই
    filter._id = { $ne: decodedToken.userId };
  }

  // Prevent QueryBuilder from using organizationId from raw query
  delete query.organizationId;

  const queryBuilder = new QueryBuilder(User.find(filter), query);

  const usersData = queryBuilder
    .filter()
    .search(userSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    usersData.build(),
    usersData.getMeta(),
  ]);

  if (query.accountType === "ORGANIZATION") {
    const dataWithOrgDetails = await Promise.all(
      data.map(async (org: any) => {
        const sub = await Subscription.findOne({ user: org._id, status: SubscriptionStatus.ACTIVE })
          .populate("plan")
          .lean();
        
        const employeesCount = await User.countDocuments({ 
          organizationId: org._id, 
          role: { $in: [Role.USER, Role.DEPARTMENT_ADMIN] } 
        });

        const departmentsCount = await User.distinct("department", {
          organizationId: org._id,
          role: { $in: [Role.USER, Role.DEPARTMENT_ADMIN] }
        });

        return {
          ...org.toObject ? org.toObject() : org,
          id: org._id.toString(), // map _id to id to match figma keys
          industry: "Technology", 
          plan: sub ? (sub.plan as any).name : "Free",
          employees: employeesCount,
          departments: departmentsCount.length,
          status: org.status === AccountStatus.APPROVED ? "Approved" : org.status === AccountStatus.REJECTED ? "Rejected" : "Pending",
          renewal: sub && sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "N/A"
        };
      })
    );
    return { data: dataWithOrgDetails, meta };
  }

  // --- Wallet Attachment Logic remains exactly the same ---
  const { year, quarter } = getCurrentQuarter();
  const userIds = data.map((user: any) => user._id);

  const wallets = await Wallet.find({
    user: { $in: userIds },
    year,
    quarter,
  });

  const usersWithWallet = data.map((user: any) => {
    const wallet = wallets.find(
      (w: any) => w.user.toString() === user._id.toString()
    );

    return {
      ...user,
      wallet: wallet
        ? {
            pointsBalance: wallet.pointsBalance,
            pointsAllocated: wallet.pointsAllocated,
          }
        : {
            pointsBalance: 0,
            pointsAllocated: 0,
          },
    };
  });

  return { data: usersWithWallet, meta };
};

const approveOrganization = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.accountType !== AccountType.ORGANIZATION) {
    throw new AppError(httpStatus.BAD_REQUEST, "Not an organization account");
  }

  user.status = AccountStatus.APPROVED;
  user.role = Role.ORGANIZATION_ADMIN;

  await user.save();

  // Send registration success/approval confirmation email
  sendEmail({
    to: user.email,
    subject: "Successful Registration - Welcome to Greetely",
    templateName: "registrationSuccess",
    templateData: {
      name: user.name,
      email: user.email,
      phone: user.phone || "N/A",
      companyName: user.companyName || "N/A",
      accountType: user.accountType,
      senderName: "Greetely Team",
    },
  }).catch((err) => console.error("Email approval notification failed:", err));

  return user;
};

const rejectOrganization = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.accountType !== AccountType.ORGANIZATION) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only organization accounts can be rejected"
    );
  }

  user.status = AccountStatus.REJECTED;
  user.role = Role.USER; // fallback safe role

  await user.save();

  return user;
};



const getMe = async (userId: string) => {
  const user = await User.findById(userId)
    .populate("organizationId", "name email picture companyName")
    .select("-password");
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const { year, quarter } = getCurrentQuarter();

  const wallet = await Wallet.findOne({
    user: user._id,
    year,
    quarter
  });

  return {
    data: {
      ...user.toObject(),
      wallet: wallet || null
    }
  };
};


const getS3KeyFromUrl = (url: string) => {
  const parts = url.split(`/${envVars.S3.S3_BUCKET_NAME}/`);
  return parts[1] ?? "";
};

const updateMyProfile = async ({
  userId,
  payload,
  decodedToken,
  file,
  oldPassword,
  newPassword,
  confirmPassword,
}: any) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "User not found");

  // Authorization check
  if (decodedToken.role === "USER" && decodedToken.userId !== userId) {
    throw new AppError(403, "You are not authorized");
  }

  // ===============================
  // 🔐 ONLY ALLOWED FIELDS
  // ===============================
  const allowedFields = ["name", "department", "accountType", "phone", "companyName"];

  const filteredPayload: any = {};

  Object.keys(payload).forEach((key) => {
    if (allowedFields.includes(key)) {
      filteredPayload[key] = payload[key];
    }
  });

  // ===============================
  // 🔐 PASSWORD UPDATE (SAFE)
  // ===============================
  if (oldPassword || newPassword || confirmPassword) {
    if (!oldPassword || !newPassword || !confirmPassword) {
      throw new AppError(400, "All password fields are required");
    }

    if (newPassword.length < 6) {
      throw new AppError(400, "New password must be at least 6 characters long");
    }

    if (newPassword !== confirmPassword) {
      throw new AppError(400, "Passwords do not match");
    }

    const isOldPasswordMatch = await bcryptjs.compare(
      oldPassword,
      user.password as string
    );

    if (!isOldPasswordMatch) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Old password is incorrect");
    }

    filteredPayload.password = await bcryptjs.hash(
      newPassword,
      Number(envVars.BCRYPT_SALT_ROUND || 10)
    );
  }

  // ===============================
  // 🖼️ PROFILE PICTURE UPDATE
  // ===============================
  if (file) {
    if (user.picture) {
      const oldKey = getS3KeyFromUrl(user.picture);
      if (oldKey) await deleteFileFromS3(oldKey);
    }

    filteredPayload.picture = file.location;
  }

  // ===============================
  // 🚀 UPDATE USER
  // ===============================
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    filteredPayload,
    {
      new: true,
      runValidators: true,
    }
  );

  return updatedUser;
};

const deleteOwnAccount = async (userId: string) => {

  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  if (user.role === Role.ORGANIZATION_ADMIN) {
    await User.deleteMany({ organizationId: user._id });
  }

  await User.findByIdAndDelete(userId);

  return { message: "Your account has been deleted successfully" };
};

const deleteAllUsers = async () => {
  const result = await User.deleteMany({});

  return result;
};

const getSingleUser = async (id: string, decodedToken: JwtPayload) => {
  const user = await User.findById(id).select("-password");
  
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // ==========================================
  // 🔐 CROSS-TENANT DATA ISOLATION (GET)
  // ==========================================
  if (decodedToken.role !== Role.SUPER_ADMIN) {
    // If the target user is an Organization Admin, their _id is the organizationId
    const targetOrgId = user.organizationId?.toString() || user._id.toString();
    const requesterOrgId = decodedToken.role === Role.ORGANIZATION_ADMIN 
      ? decodedToken.userId?.toString() 
      : decodedToken.organizationId?.toString();

    if (targetOrgId !== requesterOrgId) {
      throw new AppError(httpStatus.FORBIDDEN, "Not authorized to view users from another organization");
    }

    // We allow viewing details of any user in the same organization (tenant isolation is checked above)
  }

  const { year, quarter } = getCurrentQuarter();
  const wallet = await Wallet.findOne({ user: user._id, year, quarter });

  return {
    data: { ...user.toObject(), wallet: wallet || null }
  };
};

const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  const targetUser = await User.findById(userId);

  if (!targetUser) {
    throw new AppError(404, "User Not Found");
  }

  // Normal user cannot update others
  if (decodedToken.role === Role.USER) {
    throw new AppError(403, "Not authorized");
  }

  // ==========================================
  // 🔐 CROSS-TENANT DATA ISOLATION (UPDATE)
  // ==========================================
  if (decodedToken.role !== Role.SUPER_ADMIN) {
    if (targetUser.role === Role.SUPER_ADMIN) {
      throw new AppError(403, "Cannot modify Super Admin");
    }

    const targetOrgId = targetUser.organizationId?.toString() || targetUser._id.toString();
    const requesterOrgId = decodedToken.role === Role.ORGANIZATION_ADMIN 
      ? decodedToken.userId?.toString() 
      : decodedToken.organizationId?.toString();

    if (targetOrgId !== requesterOrgId) {
      throw new AppError(403, "Cannot modify users from another organization");
    }

    if (decodedToken.role === Role.DEPARTMENT_ADMIN) {
      if (targetUser.department !== decodedToken.department) {
        throw new AppError(403, "Cannot modify users from another department");
      }
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    payload,
    { new: true, runValidators: true }
  );

  return updatedUser;
};

const deleteUserById = async (
  id: string,
  decodedToken: JwtPayload
) => {
  const user = await User.findById(id);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  // ==========================================
  // 🔐 CROSS-TENANT DATA ISOLATION (DELETE)
  // ==========================================
  if (decodedToken.role !== Role.SUPER_ADMIN) {
    if (user.role === Role.SUPER_ADMIN) {
      throw new AppError(403, "Cannot delete Super Admin");
    }

    const targetOrgId = user.organizationId?.toString() || user._id.toString();
    const requesterOrgId = decodedToken.role === Role.ORGANIZATION_ADMIN 
      ? decodedToken.userId?.toString() 
      : decodedToken.organizationId?.toString();

    if (targetOrgId !== requesterOrgId) {
      throw new AppError(403, "Cannot delete users from another organization");
    }

    if (decodedToken.role === Role.DEPARTMENT_ADMIN) {
      if (user.department !== decodedToken.department) {
        throw new AppError(403, "Cannot delete users from another department");
      }
    }
  }

  if (user.role === Role.ORGANIZATION_ADMIN) {
    await User.deleteMany({ organizationId: user._id });
  }

  await User.findByIdAndDelete(id);

  return user;
};

const getUserBySlug = async (slug: string) => {
  // Find all organization admins
  const orgs = await User.find({ accountType: AccountType.ORGANIZATION }).lean();

  const slugify = (text: string): string => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  };

  // Find the one that matches the slug
  const matchingOrg = orgs.find(org => slugify(org.companyName || org.name) === slug);
  if (!matchingOrg) {
    throw new AppError(httpStatus.NOT_FOUND, "Organization not found");
  }

  return matchingOrg;
};

export const UserServices = {
  createUser,
  approveOrganization,
  rejectOrganization,
  getAllUsers,
  getMe,
  getSingleUser,
  getUserBySlug,
  updateUser,
  updateMyProfile,
  deleteOwnAccount,
  deleteUserById,
  deleteAllUsers
};
