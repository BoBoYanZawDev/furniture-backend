import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { errorCode } from "../../config/errorCode";

export interface customRequest extends Request {
  userId?: number;
}

export const auth = (req: customRequest, res: Response, next: NextFunction) => {
  const accessToken = req.cookies ? req.cookies.accessToken : null;
  const refreshToken = req.cookies ? req.cookies.refreshToken : null;

  if (!refreshToken) {
    const error: any = new Error("You are not an authenticated user.");
    error.status = 401;
    error.code = errorCode.unauthenticated;
    return next(error);
  }

  if (!accessToken) {
    const error: any = new Error("Access Token has expired.");
    error.status = 401;
    error.code = errorCode.accessTokenExpired;
    return next(error);
  }

  // verify access token
  let decoded;
  try {
    decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as {
      id: number;
    };
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      err.status = 401;
      err.message = "Access Token is invalid.";
      err.code = errorCode.accessTokenExpired;
    } else {
      err.status = 400;
      err.message = "Access Token is invalid.";
      err.code = errorCode.attack;
    }
    return next(err);
  }
  req.userId = decoded.id;
  next();
};
