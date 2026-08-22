import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { IsActive } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { verifyToken } from "../utils/jwt";

export const checkAuth = (...authRoles: string[]) => async (req: Request, res: Response, next: NextFunction) => {

    try {
        const bearerToken = req.headers.authorization?.startsWith("Bearer ")
            ? req.headers.authorization.split(" ")[1]
            : null;

        const accessToken = req.cookies?.accessToken || bearerToken;

        // const accessToken = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
        // const accessToken = req.headers.authorization;

        if (!accessToken) {
            throw new AppError(401, "No Token Recieved")
        }

        let verifiedToken: JwtPayload;

        try {
            verifiedToken = verifyToken(accessToken, envVars.JWT_ACCESS_SECRET) as JwtPayload;
        } catch (error: any) {
            if (error.name === "TokenExpiredError") {
                return next(new AppError(401, "Token expired"));
            }

            return next(new AppError(401, "Invalid token"));
        }
        const isUserExist = await User.findOne({ email: verifiedToken.email })

        if (!isUserExist) {
            throw new AppError(httpStatus.NOT_FOUND, "User does not exist")
        }
        if (!isUserExist.isVerified) {
            throw new AppError(httpStatus.BAD_REQUEST, "User is not verified")
        }
        if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
            throw new AppError(httpStatus.BAD_REQUEST, `User is ${isUserExist.isActive}`)
        }
        if (isUserExist.isDeleted) {
            throw new AppError(httpStatus.BAD_REQUEST, "User is deleted")
        }

        // if (!verifiedToken?.role || !authRoles.includes(verifiedToken.role)) {
        //     return next(new AppError(403, "You are not permitted to view this route"));
        // }
        // req.user = verifiedToken

        // 🔥 ROLE CHECK
        if (!authRoles.includes(isUserExist.role)) {
            return next(
                new AppError(403, "You are not permitted to view this route")
            );
        }

        // 🔥 Attach fresh user data
        req.user = {
            userId: isUserExist._id,
            email: isUserExist.email,
            role: isUserExist.role,
            department: isUserExist.department,
            organizationId: isUserExist.organizationId,
            accountType: isUserExist.accountType,
        };
        next()

    } catch (error) {
        next(error)
    }
}