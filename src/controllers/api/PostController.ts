import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { errorCode } from "../../../config/errorCode";
import { checkUploadFile } from "../../utils/check";
import { createError } from "../../utils/error";
import ImageQueue from "../../jobs/queues/imageQueue";
import { unlink } from "node:fs/promises";
import path from "path";

export interface customRequest extends Request {
  userId?: number;
  user?: any;
}



export const getPost = [
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = createError(errors[0]?.msg, 400, errorCode.invalid);
      return next(error);
    }

    
  },
];



export const getPostsByPagination = [
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = createError(errors[0]?.msg, 400, errorCode.invalid);
      return next(error);
    }


  },
];
