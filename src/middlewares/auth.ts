import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { errorCode } from "../../config/errorCode";
import { getUserById, updateUser } from "../services/authServices";
import { createError } from "../utils/error";

export interface customRequest extends Request {
  userId?: number;
}

export const auth = (req: customRequest, res: Response, next: NextFunction) => {
  const accessToken = req.cookies ? req.cookies.accessToken : null;
  const refreshToken = req.cookies ? req.cookies.refreshToken : null;

  if (!refreshToken) {
    const error: any = createError(
      "You are not an authenticated user.",
      401,
      errorCode.unauthenticated,
    );
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
      const error = createError(
        "You are not an authenticated user.",
        401,
        errorCode.unauthenticated,
      );
      return next(error);
    }

    if (isNaN(decoded.id)) {
      const err = createError(
        "This account has not register.",
        401,
        errorCode.unauthenticated,
      );
      return next(err);
    }

    const user = await getUserById(decoded.id);
    if (!user) {
      const err: any = createError(
        "This account has not register.",
        401,
        errorCode.unauthenticated,
      );
      return next(err);
    }

    if (user!.phone_no !== decoded.phone) {
      const err: any = createError(
        "You are not an authenticated user.",
        401,
        errorCode.unauthenticated,
      );
      return next(err);
    }

    if (user.randToken !== refreshToken) {
      const err: any = createError(
        "You are not an authenticated user.",
        401,
        errorCode.unauthenticated,
      );
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
        expiresIn: 60 * 10,
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
        maxAge: 10 * 60 * 1000, // 10 minutes
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production",
        sameSite: process.env.NODE_ENV == "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    req.userId = user.id;
    next(req);
  };

  if (!accessToken) {
    generateNewToken();
  } else {
    // verify access token
    let decoded;
    try {
      decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as {
        id: number;
      };

      if (isNaN(decoded.id)) {
        const err: any = createError(
          "This account has not register.",
          401,
          errorCode.unauthenticated,
        );
        return next(err);
      }

      req.userId = decoded.id;
      next();
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        generateNewToken();
      } else {
        const error = createError(
          "Access Token is invalid.",
          400,
          errorCode.attack,
        );
        return next(error);
      }
    }
  }
};
