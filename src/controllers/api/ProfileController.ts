import { Request, Response, NextFunction } from "express";

export interface customRequest extends Request {
  userId?: number;
}

export const changeLanguage = (
  req: customRequest,
  res: Response,
  next: NextFunction,
) => {};
