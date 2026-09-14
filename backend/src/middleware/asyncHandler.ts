import { Request, Response, NextFunction } from "express";
import { sendServerError } from "../utils/response";

type AsyncHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
) => Promise<void> | void;

/**
 * Wraps an async route handler so uncaught rejections are turned into a
 * standard 500 response instead of crashing the process (Express 4 does not
 * forward rejected promises to the error handler on its own).
 */
export function asyncHandler(fn: AsyncHandler) {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch((err) => {
            console.error("[asyncHandler]", err);
            sendServerError(res);
        });
    };
}