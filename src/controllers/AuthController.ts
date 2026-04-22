import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import {
  createOtp,
  createUser,
  getOtpByPhone,
  getUserById,
  getUserByPhone,
  updateOtp,
  updateUser,
} from "../services/authServices";
import {
  checkOptErrorIfSameDate,
  checkOtpRow,
  checkUserExists,
  checkUserIfNotExists,
} from "../utils/auth";
import { generateOTP, generateToken } from "../utils/generate";
import bcrypt from "bcrypt";
import { error } from "node:console";
import moment from "moment";
import jwt from "jsonwebtoken";
import { errorCode } from "../../config/errorCode";

export const register = [
  body("phone")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 })
    .withMessage("Invalid phone number"),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0]?.msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }

    let phone = req.body.phone;
    if (phone.slice(0, 2) === "09") {
      phone = phone.substring(2, phone.length);
    }

    const user = await getUserByPhone(phone);
    checkUserExists(user);

    const otp = generateOTP();
    const token = generateToken();
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp.toString(), salt);
    const otpRow = await getOtpByPhone(phone);
    let result;
    if (!otpRow) {
      // sent otp
      const otpData = {
        phone_no: phone,
        otp: hashedOTP,
        rememberToken: token,
        count: 1,
      };
      result = await createOtp(otpData);
    } else {
      const lastOtpReq = new Date(otpRow.updatedAt).toLocaleDateString();
      const now = new Date().toLocaleDateString();
      const isSameDate = lastOtpReq === now;
      checkOptErrorIfSameDate(isSameDate, otpRow.errorCount);
      if (!isSameDate) {
        const otpData = {
          otp: hashedOTP,
          rememberToken: token,
          count: 1,
          errorCount: 0,
        };
        result = await updateOtp(otpRow.id, otpData);
      } else {
        if (otpRow.count >= 3) {
          const error: any = new Error(
            "OTP is alowed only 3 times a day. Please try again tomorrow.",
          );
          error.status = 405;
          error.code = errorCode.overLimit;
          return next(error);
        } else {
          const otpData = {
            otp: hashedOTP,
            rememberToken: token,
            count: {
              increment: 1,
            },
          };
          result = await updateOtp(otpRow.id, otpData);
        }
      }
    }
    res.status(200).json({
      message: `We are sending an OTP to 09${result.phone_no}`,
      phone: result.phone_no,
      token: result.rememberToken,
    });
  },
];

export const verifyOtp = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  body("otp", "Invalid OTP")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 6, max: 6 }),
  body("token", "Invalid Token").trim().notEmpty().escape(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0]?.msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }

    const { phone, otp, token } = req.body;
    const user = await getUserByPhone(phone);
    checkUserExists(user);

    const otpRow = await getOtpByPhone(phone);
    checkOtpRow(otpRow);

    const lastOtpReq = new Date(otpRow!.updatedAt).toLocaleDateString();
    const now = new Date().toLocaleDateString();
    const isSameDate = lastOtpReq === now;
    checkOptErrorIfSameDate(isSameDate, otpRow!.errorCount);

    let result;

    if (otpRow!.rememberToken !== token) {
      const otpData = {
        errorCount: 5,
      };
      await updateOtp(otpRow!.id, otpData);
      const error: any = new Error("Invalid OTP or token");
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }

    const isExpire = moment().diff(otpRow?.updatedAt, "minutes") > 2;
    if (isExpire) {
      const error: any = new Error("OTP is expired");
      error.status = 403;
      error.code = errorCode.otpExpired;
      return next(error);
    }
    const isMatchOtp = bcrypt.compare(otp, otpRow!.otp);
    if (!isMatchOtp) {
      if (!isSameDate) {
        const otpData = {
          errorCount: 1,
        };
        await updateOtp(otpRow!.id, otpData);
      } else {
        // if otp is not first time today
        const otpData = {
          errorCount: {
            increment: 1,
          },
        };
        await updateOtp(otpRow!.id, otpData);
      }
      const error: any = new Error("OTP is incorrect");
      error.status = 401;
      error.code = errorCode.invalid;
      return next(error);
    }
    const verifyToken = generateToken();
    const otpData = {
      verifiedToken: verifyToken,
      errorCount: 0,
      count: 1,
    };

    result = await updateOtp(otpRow!.id, otpData);

    res.status(200).json({
      message: "OTP verified successfully",
      phone: result.phone_no,
      verifyToken: result.verifiedToken,
    });
  },
];

export const confirmPassword = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  body("password", "Password must be 8 digit")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 8, max: 8 }),
  body("token", "Invalid Token").trim().notEmpty().escape(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0]?.msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }

    const { phone, password, token } = req.body;

    const user = await getUserByPhone(phone);
    checkUserExists(user);

    const otpRow = await getOtpByPhone(phone);
    checkOtpRow(otpRow);

    // otp error count is overlimit
    if (otpRow?.errorCount === 5) {
      const error: any = new Error("This request may be an attack");
      error.status = 400;
      error.code = errorCode.attack;
      return next(error);
    }

    if (otpRow?.verifiedToken != token) {
      const otpData = {
        errorCount: 5,
      };
      await updateOtp(otpRow!.id, otpData);
      const error: any = new Error("Invalid Token");
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }

    // request is expire
    const isExpired = moment().diff(otpRow?.updatedAt, "minutes") > 10;
    if (isExpired) {
      const error: any = new Error(
        "Your request is expired. Please try again.",
      );
      error.status = 403;
      error.code = errorCode.requestExpired;
      return next(error);
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const randToken = "I Will replace refresh token soon.";
    const userData = {
      phone_no: phone,
      password: hashPassword,
      randToken,
    };
    const newUser = await createUser(userData);

    const accessPayload = {
      id: newUser.id,
    };
    const refreshPayload = {
      id: newUser.id,
      phone: newUser.phone_no,
    };

    const accessToken = jwt.sign(
      accessPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 60 * 15,
      },
    );
    const refreshToken = jwt.sign(
      refreshPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      {
        expiresIn: "30d",
      },
    );

    const updateUserData = {
      randToken: refreshToken,
    };
    await updateUser(newUser.id, updateUserData);

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production",
        sameSite: process.env.NODE_ENV == "production" ? "none" : "strict",
        maxAge: 10 * 60 * 1000, // 10 minutes
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production",
        sameSite: process.env.NODE_ENV == "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 15 minutes
      })
      .status(201)
      .json({
        message: "Successfully created an account",
        userId: newUser.id,
      });
  },
];

export const login = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  body("password", "Password must be 8 digit")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 8, max: 8 }),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0]?.msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }

    let { phone, password } = req.body;
    if (phone.slice(0, 2) === "09") {
      phone = phone.substring(2, phone.length);
    }

    const user = await getUserByPhone(phone);
    checkUserIfNotExists(user);
    if (user?.status == "FREEZE") {
      const error: any = new Error(
        "Your account is temporarily locked. Please contact us.",
      );
      error.status = 400;
      error.code = errorCode.accountFreeze;
      return next(error);
    }

    const isMatchPassword = bcrypt.compare(password, user!.password);
    if (!isMatchPassword) {
      const lastRequest = new Date(user!.updatedAt).toLocaleDateString();
      const isSameDate = lastRequest == new Date().toLocaleDateString();
      let userData;
      if (!isSameDate) {
        userData = {
          errorLoginCount: 1,
        };
      } else {
        if (user!.errorLoginCount >= 2) {
          userData = {
            status: "FREEZE",
          };
        } else {
          userData = {
            errorLoginCount: {
              increment: 1,
            },
          };
        }
      }
      await updateUser(user!.id, userData);

      const error: any = new Error("Password doesn't match.");
      error.status = 401;
      error.code = errorCode.invalid;
      return next(error);
    }

    const accessPayload = {
      id: user!.id,
    };
    const refreshPayload = {
      id: user!.id,
      phone: user!.phone_no,
    };

    const accessToken = jwt.sign(
      accessPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 60 * 10,
      },
    );
    const refreshToken = jwt.sign(
      refreshPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      {
        expiresIn: "30d",
      },
    );

    const updateUserData = {
      errorLoginCount: 0,
      randToken: refreshToken,
    };
    await updateUser(user!.id, updateUserData);

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production",
        sameSite: process.env.NODE_ENV == "production" ? "none" : "strict",
        maxAge: 10 * 60 * 1000, // 15 minutes
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production",
        sameSite: process.env.NODE_ENV == "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 15 minutes
      })
      .status(201)
      .json({
        message: "Successfully Login",
        userId: user!.id,
      });
  },
];

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const refreshToken = req.cookies ? req.cookies.refreshToken : null;
  if (!refreshToken) {
    const error: any = new Error("You are not an authenticated user.");
    error.status = 401;
    error.code = errorCode.unauthenticated;
    return next(error);
  }

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

  const user = await getUserById(decoded.id);
  checkUserIfNotExists(user);
  if (user?.phone_no !== decoded.phone) {
    const error: any = new Error("You are not an authenticated user.");
    error.status = 401;
    error.code = errorCode.unauthenticated;
    return next(error);
  }
  const userData = {
    randToken: generateToken(),
  };

  await updateUser(user!.id, userData);

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV == "production",
    sameSite: process.env.NODE_ENV == "production" ? "none" : "strict",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV == "production",
    sameSite: process.env.NODE_ENV == "production" ? "none" : "strict",
  });

  res.status(200).json({ message: "Logout successful,See You Soon." });
};

export const forgetPassword = [
  body("phone")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 })
    .withMessage("Invalid phone number"),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0]?.msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }

    let phone = req.body.phone;
    if (phone.slice(0, 2) === "09") {
      phone = phone.substring(2, phone.length);
    }

    const user = await getUserByPhone(phone);
    checkUserIfNotExists(user);

    const otp = generateOTP();
    const token = generateToken();
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp.toString(), salt);
    const otpRow = await getOtpByPhone(phone);
    let result;
    if (!otpRow) {
      // sent otp
      const otpData = {
        phone_no: phone,
        otp: hashedOTP,
        rememberToken: token,
        count: 1,
      };
      result = await createOtp(otpData);
    } else {
      const lastOtpReq = new Date(otpRow.updatedAt).toLocaleDateString();
      const now = new Date().toLocaleDateString();
      const isSameDate = lastOtpReq === now;
      checkOptErrorIfSameDate(isSameDate, otpRow.errorCount);
      if (!isSameDate) {
        const otpData = {
          otp: hashedOTP,
          rememberToken: token,
          count: 1,
          errorCount: 0,
        };
        result = await updateOtp(otpRow.id, otpData);
      } else {
        if (otpRow.count >= 3) {
          const error: any = new Error(
            "OTP is alowed only 3 times a day. Please try again tomorrow.",
          );
          error.status = 405;
          error.code = errorCode.overLimit;
          return next(error);
        } else {
          const otpData = {
            otp: hashedOTP,
            rememberToken: token,
            count: {
              increment: 1,
            },
          };
          result = await updateOtp(otpRow.id, otpData);
        }
      }
    }
    res.status(200).json({
      message: `We are sending an OTP to 09${result.phone_no}`,
      phone: result.phone_no,
      token: result.rememberToken,
    });
  },
];

export const verifyOTPForPassword = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  body("otp", "Invalid OTP")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 6, max: 6 }),
  body("token", "Invalid Token").trim().notEmpty().escape(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0]?.msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }

    const { phone, otp, token } = req.body;
    const user = await getUserByPhone(phone);
    checkUserIfNotExists(user);

    const otpRow = await getOtpByPhone(phone);
    checkOtpRow(otpRow);

    const lastOtpReq = new Date(otpRow!.updatedAt).toLocaleDateString();
    const now = new Date().toLocaleDateString();
    const isSameDate = lastOtpReq === now;
    checkOptErrorIfSameDate(isSameDate, otpRow!.errorCount);

    let result;

    if (otpRow!.rememberToken !== token) {
      const otpData = {
        errorCount: 5,
      };
      await updateOtp(otpRow!.id, otpData);
      const error: any = new Error("Invalid OTP or token");
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }

    const isExpire = moment().diff(otpRow?.updatedAt, "minutes") > 2;
    if (isExpire) {
      const error: any = new Error("OTP is expired");
      error.status = 403;
      error.code = errorCode.otpExpired;
      return next(error);
    }
    const isMatchOtp = bcrypt.compare(otp, otpRow!.otp);
    if (!isMatchOtp) {
      if (!isSameDate) {
        const otpData = {
          errorCount: 1,
        };
        await updateOtp(otpRow!.id, otpData);
      } else {
        // if otp is not first time today
        const otpData = {
          errorCount: {
            increment: 1,
          },
        };
        await updateOtp(otpRow!.id, otpData);
      }
      const error: any = new Error("OTP is incorrect");
      error.status = 401;
      error.code = errorCode.invalid;
      return next(error);
    }
    const verifyToken = generateToken();
    const otpData = {
      verifiedToken: verifyToken,
      errorCount: 0,
      count: 1,
    };

    result = await updateOtp(otpRow!.id, otpData);

    res.status(200).json({
      message: "OTP verified successfully to reset password",
      phone: result.phone_no,
      verifyToken: result.verifiedToken,
    });
  },
];

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {};
