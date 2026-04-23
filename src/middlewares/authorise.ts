import { Request, Response, NextFunction } from "express";
import { getUserById } from "../services/authServices";
import { errorCode } from "../../config/errorCode";
import { createError } from "../utils/error";

export interface customRequest extends Request {
  userId?: number;
  user?: any;
}

export const authorise = (allow: boolean, ...roles: string[]) => {
  return async (req: customRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;
    const user = await getUserById(userId!);
    if (!user) {
      const error: any = createError(
        "This Account has not registered",
        401,
        errorCode.unauthenticated,
      );
      return next(error);
    }

    const matched = roles.includes(user.role);
    if (allow && !matched) {
      const error: any = createError(
        "This action is not allowed.",
        403,
        errorCode.unauthorised,
      );
      return next(error);
    }

    if (!allow && matched) {
      const error: any = createError(
        "This action is not allowed.",
        403,
        errorCode.unauthorised,
      );
      return next(error);
    }

    req.user = user;
    next();
  };
};
