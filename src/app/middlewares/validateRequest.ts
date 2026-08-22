import { NextFunction, Request, Response } from "express"
import { ZodError, ZodObject } from "zod"
import AppError from "../errorHelpers/AppError"
import httpStatus from "http-status-codes";

export const validateRequest = (zodSchema: ZodObject) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        // req.body =JSON.parse(req.body.data || {}) || req.body
        if (req.body && req.body.data) {
            req.body = JSON.parse(req.body.data)
        }
        if (!req.body) req.body = {}
        req.body = await zodSchema.parseAsync(req.body)
        next()
    } catch (error) {
         if (error instanceof ZodError) {
            // Wrap in AppError so globalErrorHandler handles it properly
            return next(new AppError(httpStatus.BAD_REQUEST, error.message || "Invalid request"))
        }
        next(error)
    }
}