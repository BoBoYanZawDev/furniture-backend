import { Request, Response, NextFunction } from "express";
import { customRequest } from "../middlewares/check";

export const healCheck = (
  req: customRequest,
  res: Response,
  next: NextFunction,
) => {
  //   throw new Error("An error occurs!!");
  res.status(200).json({
    message: "Hello we are ready for sending response",
    userId: req.userId,
  });
};
