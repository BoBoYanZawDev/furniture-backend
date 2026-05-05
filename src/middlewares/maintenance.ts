import { Request, Response, NextFunction } from "express";
import { getSettingStatus } from "../services/settingServices";
import { errorCode } from "../../config/errorCode";
import { createError } from "../utils/error";

// const WHITE_LIST = ["172.0.0.1"];

export const maintenance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
//   const ip: any =
//     req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
//   if (WHITE_LIST.includes(ip)) {
//     return next();
//   }

  const setting = await getSettingStatus("maintenance");
  if (setting && setting.value === "true") {
    return next(
      createError(
        "The system is under maintenance. Please try again later.",
        503,
        errorCode.maintenance,
      ),
    );
  }
  next();
};
