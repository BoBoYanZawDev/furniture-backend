import { Request, Response, NextFunction } from "express";
import { body, check, validationResult } from "express-validator";
import {
  createOtp,
  getOtpByPhone,
  getUserByPhone,
  updateOtp,
} from "../services/authServices";
import {
  checkOptErrorIfSameDate,
  checkOtpRow,
  checkUserExists,
} from "../utils/auth";
import { generateOTP, generateToken } from "../utils/generate";
import bcrypt from "bcrypt";
import { error } from "node:console";
import moment from "moment";

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
      error.code = "Error_Invalid";
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
          error.code = "ERROR_OTP_LIMIT";
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
      error.code = "VALIDATION_ERROR";
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
      result = await updateOtp(otpRow!.id, otpData);
      const error: any = new Error("Invalid OTP or token");
      error.status = 400;
      error.code = "ERROR_INVALID";
      return next(error);
    }

    const isExpire = moment().diff(otpRow?.updatedAt, "minutes") > 2;
    if (isExpire) {
      const error: any = new Error("OTP is expired");
      error.status = 403;
      error.code = "ERROR_EXPIRED";
      return next(error);
    }
    const isMatchOtp = bcrypt.compare(otp, otpRow!.otp);
    if (!isMatchOtp) {
      if (!isSameDate) {
        const otpData = {
          errorCount: 1,
        };
        result = await updateOtp(otpRow!.id, otpData);
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
      error.code = "ERROR_INVLAID";
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

export const confirmPassword = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(200).json({ message: "Password confirmed successfully" });
};

export const login = (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({ message: "Login successful" });
};

export const logout = (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({ message: "Logout successful" });
};
