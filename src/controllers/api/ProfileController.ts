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
import sharp from "sharp";
import ImageQueue from "../../jobs/queues/imageQueue";

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
export const uploadProfileOptimized = async (
  req: customRequest,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.userId;
  const image = req.file;
  const user = await getUserById(userId!);
  checkUserIfNotExists(user);
  checkUploadFile(image);

  const fileName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ".png";

  try {
    const optimizedImagePath = path.join(
      __dirname,
      "../../..",
      "/uploads/images",
      fileName,
    );
    await sharp(req.file.buffer)
      .resize(200, 200, { fit: "cover" })
      .png({ quality: 75 })
      .toFile(optimizedImagePath);
  } catch (err) {
    console.error("Error optimizing image:", err);
    res.status(500).json({ message: "Error optimizing image" });
    return;
  }

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

export const uploadProfileOptimizedWithQue = async (
  req: customRequest,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.userId;
  const image = req.file;
  const user = await getUserById(userId!);
  checkUserIfNotExists(user);
  checkUploadFile(image);

  const splitFileName = image.filename.split(".")[0];

  const job = await ImageQueue.add("optimize_img", {
    filePath: req.file?.path,
    fileName: `${splitFileName}.webp`,
  });

  if (user?.image) {
    try {
      const orgFilePath = path.join(
        __dirname,
        "../../..",
        "/uploads/images",
        user!.image!,
      );
      const optimizedFilePath = path.join(
        __dirname,
        "../../..",
        "/uploads/optimize_img",
        user!.image!.split(".")[0] + ".webp",
      );
      await unlink(orgFilePath);
      await unlink(optimizedFilePath);
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  }

  const userData = {
    image: image?.filename,
  };
  await updateUser(user?.id!, userData);

  res.status(200).json({
    message: "Profile picture uploaded successfully",
    image: splitFileName + ".webp",
    jobID: job.id,
  });
};

// for testing
export const getMyPhoto = async (
  req: customRequest,
  res: Response,
  next: NextFunction,
) => {
  const file = path.join(
    __dirname,
    "../../..",
    "/uploads/images",
    "1778039971221-416128952-r-d-software-checklist-06-05-2026.png",
  );
  res.sendFile(file, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(404).send("File not found");
    }
  });
};

export const uploadProfileMultiple = async (
  req: customRequest,
  res: Response,
  next: NextFunction,
) => {
  const images = req.files;
  let fileNames: string[] = [];
  if (images instanceof Array && images.length > 0) {
    images.forEach((image: any) => {
      checkUploadFile(images);
      fileNames.push(image.filename);
    });
  }
  res
    .status(200)
    .json({ message: "Profile picture uploaded successfully", fileNames });
};
