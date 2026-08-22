
import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import jwt, { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { sendEmail } from "../../utils/sendEmail";
import { createNewAccessTokenWithRefreshToken } from "../../utils/userTokens";
import { IAuthProvider } from "../user/user.interface";
import { User } from "../user/user.model";
import { redisClient } from "../../config/redis.config";
import { generateOtp } from "../otp/otp.service";

const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken = await createNewAccessTokenWithRefreshToken(refreshToken)

  return {
    accessToken: newAccessToken
  }

}

const resetPassword = async (
  email: string,
  newPassword: string,
  confirmPassword: string
) => {
  if (newPassword !== confirmPassword) {
    throw new AppError(400, "Passwords do not match");
  }

  const verifiedKey = `otp:reset:verified:${email}`;
  const isVerified = await redisClient.get(verifiedKey);

  if (!isVerified) {
    throw new AppError(401, "OTP verification required");
  }

  const user = await User.findOne({ email });

  if (!user) throw new AppError(404, "User not found");
  if (!user.isVerified) throw new AppError(401, "User not verified");
  if (user.isDeleted) throw new AppError(400, "User is deleted");
  if (user.isActive === "BLOCKED" || user.isActive === "INACTIVE") {
    throw new AppError(400, `User is ${user.isActive}`);
  }

  const hashedPassword = await bcryptjs.hash(
    newPassword,
    Number(envVars.BCRYPT_SALT_ROUND || 10)
  );

  user.password = hashedPassword;
  await user.save();

  await redisClient.del([verifiedKey]);

  return null;
};

const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email });

  if (!user) throw new AppError(404, "User not found");
  if (!user.isVerified) throw new AppError(401, "User not verified");
  if (user.isDeleted) throw new AppError(400, "User is deleted");
  if (user.isActive === "BLOCKED" || user.isActive === "INACTIVE") {
    throw new AppError(400, `User is ${user.isActive}`);
  }

  const redisKey = `otp:reset:${email}`;

  const existingOtp = await redisClient.get(redisKey);
  if (existingOtp) {
    throw new AppError(429, "OTP already sent. Please wait 2 minutes.");
  }

  const otp = generateOtp();

  await redisClient.set(redisKey, otp, {
    expiration: { type: "EX", value: 120 },
  });

  await sendEmail({
    to: email,
    subject: "Password Reset OTP",
    templateName: "otp",
    templateData: {
      name: user.name,
      otp,
    },
  });
};

const setPassword = async (userId: string, plainPassword: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.password && user.auths.some(providerObject => providerObject.provider === "google")) {
    throw new AppError(httpStatus.BAD_REQUEST, "You have already set you password. Now you can change the password from your profile password update")
  }

  const hashedPassword = await bcryptjs.hash(
    plainPassword,
    Number(envVars.BCRYPT_SALT_ROUND)
  )

  const credentialProvider: IAuthProvider = {
    provider: "credentials",
    providerId: user.email
  }

  const auths: IAuthProvider[] = [...user.auths, credentialProvider]

  user.password = hashedPassword

  user.auths = auths

  await user.save()

}
const changePassword = async (oldPassword: string, newPassword: string, confirmPassword: string, decodedToken: JwtPayload) => {
  if (newPassword.length < 6) {
    throw new AppError(400, "New password must be at least 6 characters long");
  }
  if (newPassword !== confirmPassword) {
    throw new AppError(400, "Passwords do not match");
  }
  const user = await User.findById(decodedToken.userId)

  const isOldPasswordMatch = await bcryptjs.compare(oldPassword, user!.password as string)
  if (!isOldPasswordMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Old Password does not match");
  }

  user!.password = await bcryptjs.hash(newPassword, Number(envVars.BCRYPT_SALT_ROUND))

  user!.save();


}

export const AuthServices = {
  getNewAccessToken,
  changePassword,
  setPassword,
  forgotPassword,
  resetPassword
}