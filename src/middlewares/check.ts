import { Request, Response, NextFunction } from "express";

export interface customRequest extends Request {
  userId?: number;
}

export const check = (req: customRequest, res: Response, next: NextFunction) => {
  req.userId = 1234;
  next();
};
