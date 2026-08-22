import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { redisClient } from "../config/redis.config";
import AppError from "../errorHelpers/AppError";

const MAX_REQUESTS = 20;
const WINDOW_SECONDS = 60 * 60;

export const aiRateLimiter = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = req.user as JwtPayload;
    const userId = user.userId;
    const key = `ai_rate: ${ userId }`;

    const count = await redisClient.incr(key);

    if (count === 1) {
        await redisClient.expire(key, WINDOW_SECONDS);
    }
   
    if (Number(count) > MAX_REQUESTS) {
        throw new AppError(
            httpStatus.TOO_MANY_REQUESTS,
            "AI generation limit exceeded"
        );
    }

    next();
};