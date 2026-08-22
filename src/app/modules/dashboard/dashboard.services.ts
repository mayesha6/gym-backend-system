import { ClassSession } from "../class/class.model";
import { UserMembership } from "../membership/membership.model";
import { IsActive, Role } from "../user/user.interface";
import { User } from "../user/user.model";

const getAdminMetrics = async () => {
  const totalMembers = await User.countDocuments({ role: Role.MEMBER, isDeleted: { $ne: true } });
  const activeMembers = await User.countDocuments({
    role: Role.MEMBER,
    isActive: IsActive.ACTIVE,
    isDeleted: { $ne: true },
  });

  const activeRatio = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;
  const totalClasses = await ClassSession.countDocuments({ isActive: true });

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringSoonCount = await UserMembership.countDocuments({
    expiryDate: { $gte: now, $lte: thirtyDaysFromNow },
  });

  const expiredCount = await UserMembership.countDocuments({
    expiryDate: { $lt: now },
  });

  return {
    totalMembers,
    activeMembers,
    activeRatio,
    totalClasses,
    expiringSoonCount,
    expiredCount,
  };
};

export const DashboardServices = {
  getAdminMetrics,
};
