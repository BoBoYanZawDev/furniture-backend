import { Request, Response, NextFunction } from "express";

export interface customRequest extends Request {
  userId?: number;
}

export const getAllUsers = (
  req: customRequest,
  res: Response,
  next: NextFunction,
) => {
  const id = req.userId;
  //   throw new Error("An error occurs!!");
  res.status(200).json({
    message: req.t(["welcome"]),
    currentUserId: id,
  });
};
