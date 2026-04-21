import { Request, Response, NextFunction } from "express";
import { getUserById } from "../services/authServices";
import { errorCode } from "../../config/errorCode";

export interface customRequest extends Request {
  userId?: number;
  user?: any;
}

export const authorise = (allow: boolean, ...roles: string[]) => {
  return async (req: customRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;
    const user = await getUserById(userId!);
    if (!user) {
      const error: any = new Error("This Account has not registered");
      error.status = 401;
      error.code = errorCode.unauthenticated;
      return next(error);
    }

    const matched = roles.includes(user.role);
    if (allow && !matched) {
      const error: any = new Error("This action is not allowed.");
      error.status = 403;
      error.code = errorCode.unauthorised;
      return next(error);
    }

    if (!allow && matched) {
      const error: any = new Error("This action is not allowed.");
      error.status = 403;
      error.code = errorCode.unauthorised;
      return next(error);
    }

    req.user = user;
    next();
  };
};
