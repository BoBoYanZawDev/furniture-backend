import { Request, Response, NextFunction } from "express";

export interface customRequest extends Request {
  user?: any;
}

export const getAllUsers = (
  req: customRequest,
  res: Response,
  next: NextFunction,
) => {
  const user = req.user;
  //   throw new Error("An error occurs!!");
  res.status(200).json({
    message: req.t(["welcome"]),
    currentUserRole: user.role,
  });
};
