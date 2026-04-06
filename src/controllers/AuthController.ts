import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";

export const register = [
  body("phone")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  async (req: Request, res: Response, next: NextFunction) => {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({ errors: errors.array() });
    // }
    res.render("404", { title: "404 Error", message: "Page Not Found" });
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
