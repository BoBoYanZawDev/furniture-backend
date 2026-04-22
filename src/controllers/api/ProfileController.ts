import { Request, Response, NextFunction } from "express";
import { query, validationResult } from "express-validator";
import { errorCode } from "../../../config/errorCode";
import { authorise } from "../../utils/authorise";
import { getUserById } from "../../services/authServices";
import { checkUserIfNotExists } from "../../utils/auth";
export interface customRequest extends Request {
  userId?: number;
}

export const changeLanguage = [
  query("lng", "Invalid Language")
    .trim()
    .notEmpty()
    .matches("^[a-z]+$")
    .isLength({ min: 2, max: 3 }),
  async (req: customRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0]?.msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }
    const { lng } = req.query;
    res.cookie("i18next", lng);
    res.status(200).json({ message: req.t("changeLng", { lang: lng }) });
  },
];

export const testPermission = async (
  req: customRequest,
  res: Response,
  next: NextFunction,
) => {
  const info: any = {
    title: "Testing Permission",
  };
  const userId = req.userId;
  const user = await getUserById(userId!);
  checkUserIfNotExists(user);

  const can = authorise(true, user!.role, "AUTHOR");
  if (can) {
    info.content = "You have permission to read this line";
  }
  res.status(200).json({ info });
};
