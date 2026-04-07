import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";

export const register = [
  body("phone")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 })
    .withMessage("Invalid phone number"),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({onlyFirstError: true});
    if (errors.length > 0) {
      const error:any = new Error(errors[0]?.msg);
      error.status = 400;
      error.code = "VALIDATION_ERROR";
      return next(error);
    }
     res.status(200).json({ message: "registered successfully" });
  },
];

export const verifyOtp = (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({ message: "OTP verified successfully" });
};
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
