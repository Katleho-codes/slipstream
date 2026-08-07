import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { sendError } from "../utils/response";

// export function validate(schema: ZodSchema) {
//     return (req: Request, res: Response, next: NextFunction): void => {
//         const result = schema.safeParse(req.body);
//         try {
//             req.body = result;

//             next();
//         } catch (err) {
//             console.log("validate error", err);
//             if (err instanceof ZodError) {
//                 sendError(res, "Validation failed", 422, err.issues);
//                 return;
//             }
//             next(err);
//         }
//     };
// }
export const validate =
    (schema: ZodSchema) =>
    (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten().fieldErrors,
            });
        }

        req.body = result.data;
        next();
    };
