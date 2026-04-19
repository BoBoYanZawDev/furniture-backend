import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { errorCode } from "../../config/errorCode";
import { getUserById, updateUser } from "../services/authServices";

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
  const generateNewToken = async () => {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as {
        id: number;
        phone: string;
      };
    } catch (err: any) {
      err.status = 401;
      err.message = "You are not an authenticated user.";
      err.code = errorCode.unauthenticated;
      return next(err);
    }

    if (isNaN(decoded.id)) {
      const err: any = new Error("This account has not register.");
      err.status = 401;
      err.code = errorCode.unauthenticated;
      return next(err);
    }

    const user = await getUserById(decoded.id);
    if (!user) {
      const err: any = new Error("This account has not register.");
      err.status = 401;
      err.code = errorCode.unauthenticated;
      return next(err);
    }

    if (user!.phone_no !== decoded.phone) {
      const err: any = new Error("You are not an authenticated user.");
      err.status = 401;
      err.message = "You are not an authenticated user.";
      err.code = errorCode.unauthenticated;
      return next(err);
    }

    if (user.randToken !== refreshToken) {
      const err: any = new Error("You are not an authenticated user.");
      err.status = 401;
      err.message = "You are not an authenticated user.";
      err.code = errorCode.unauthenticated;
      return next(err);
    }

    const accessPayload = {
      id: user!.id,
    };
    const refreshPayload = {
      id: user!.id,
      phone: user!.phone_no,
    };

    const newAccessToken = jwt.sign(
      accessPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 60 * 15,
      },
    );
    const newRefreshToken = jwt.sign(
      refreshPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      {
        expiresIn: "30d",
      },
    );

    const updateUserData = {
      randToken: newRefreshToken,
    };
    await updateUser(user!.id, updateUserData);

    res
      .cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production",
        sameSite: process.env.NODE_ENV == "production" ? "none" : "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production",
        sameSite: process.env.NODE_ENV == "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 15 minutes
      });
    req.userId = user.id;
    next(req);
  };

  if (!accessToken) {
    generateNewToken();
    // const error: any = new Error("Access Token has expired.");
    // error.status = 401;
    // error.code = errorCode.accessTokenExpired;
    // return next(error);
  } else {
    // verify access token
    let decoded;
    try {
      decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as {
        id: number;
      };

      if (isNaN(decoded.id)) {
        const err: any = new Error("This account has not register.");
        err.status = 401;
        err.code = errorCode.unauthenticated;
        return next(err);
      }

      req.userId = decoded.id;
      next();
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        generateNewToken();
        // err.status = 401;
        // err.message = "Access Token is invalid.";
        // err.code = errorCode.accessTokenExpired;
      } else {
        err.status = 400;
        err.message = "Access Token is invalid.";
        err.code = errorCode.attack;
        return next(err);
      }
    }
  }
};
