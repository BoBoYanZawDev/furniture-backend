import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { createError } from "../../utils/error";
import { errorCode } from "../../../config/errorCode";
import { createOrUpdateSettingStatus } from "../../services/settingServices";

export interface customRequest extends Request {
  user?: any;
}

export const setMaintenance = [
  body("mode", "Mode must be boolean.").isBoolean(),
  async (req: customRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = createError(errors[0]?.msg, 400, errorCode.invalid);
      return next(error);
    }
    // const user = req.user;
    const { mode } = req.body;
    const value = mode ? "true" : "false";
    const message = mode
      ? "Successfully set Maintenance mode."
      : "Successfully turn off Maintenance mode.";

    await createOrUpdateSettingStatus("maintenance", value);

    res.status(200).json({ message });
  },
];
