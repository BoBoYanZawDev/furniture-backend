import { Request, Response, NextFunction } from "express";
import { query, validationResult } from "express-validator";
import { errorCode } from "../../../config/errorCode";
import { authorise } from "../../utils/authorise";
import { getUserById, updateUser } from "../../services/authServices";
import { checkUserIfNotExists } from "../../utils/auth";
import { createError } from "../../utils/error";
import { checkUploadFile } from "../../utils/check";
import { unlink } from "node:fs/promises";
import path from "path";

export interface customRequest extends Request {
  userId?: number;
  file?: any;
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
      const error: any = createError(errors[0]?.msg, 400, errorCode.invalid);
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

export const uploadProfile = async (
  req: customRequest,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.userId;
  const image = req.file;
  const user = await getUserById(userId!);
  checkUserIfNotExists(user);
  checkUploadFile(image);

  const fileName = image!.filename;
  if (user?.image) {
    try {
      const filePath = path.join(
        __dirname,
        "../../..",
        "/uploads/images",
        user!.image!,
      );
      await unlink(filePath);
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  }
  const userData = {
    image: fileName,
  };

  await updateUser(user?.id!, userData);

  res.status(200).json({ message: "Profile picture uploaded successfully" });
};
