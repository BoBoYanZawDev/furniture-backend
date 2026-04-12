import { errorCode } from "../../config/errorCode";

export const checkUserExists = (user: any) => {
  if (user) {
    const error: any = new Error("Phone number already registered");
    error.status = 409;
    error.code = errorCode.userExist;
    throw error;
  }
};
export const checkUserIfNotExists = (user: any) => {
  if (!user) {
    const error: any = new Error("This phone has not registered");
    error.status = 401;
    error.code = errorCode.unauthenticated;
    throw error;
  }
};

export const checkOptErrorIfSameDate = (
  isSameDate: boolean,
  errorCount: number,
) => {
  if (isSameDate && errorCount >= 5) {
    const error: any = new Error(
      "Too many OTP requests. Please try again tomorrow.",
    );
    error.status = 401;
    error.code = errorCode.overLimit;
    throw error;
  }
};

export const checkOtpRow = (otpRow: any) => {
  if (!otpRow) {
    const error: any = new Error("Invalid OTP or token");
    error.status = 400;
    error.code = errorCode.overLimit;
    throw error;
  }
};
