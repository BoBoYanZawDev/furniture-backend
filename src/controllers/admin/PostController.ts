import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { errorCode } from "../../../config/errorCode";
import { checkUploadFile } from "../../utils/check";
import { createError } from "../../utils/error";
import ImageQueue from "../../jobs/queues/imageQueue";
import { checkUserIfNotExistsRemoveFile } from "../../utils/auth";
import {
  createOnePost,
  getPostById,
  PostArgs,
  updateOnePost,
} from "../../services/postServices";
import sanitizeHtml from "sanitize-html";
import { removeFiles } from "../../utils/helper";

export interface customRequest extends Request {
  userId?: number;
  user?: any;
}

export const createPost = [
  body("title", "Title is required").trim().notEmpty().escape(),
  body("content", "Content is required").trim().notEmpty().escape(),
  body("body", "Body is required")
    .trim()
    .notEmpty()
    .customSanitizer((value) => sanitizeHtml(value))
    .notEmpty(),
  body("category", "Category is required.").trim().notEmpty().escape(),
  body("type", "Type is required.").trim().notEmpty().escape(),
  body("tags", "Tag is invalid.")
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value) {
        return value.split(",").filter((tag: string) => tag.trim() !== "");
      }
      return value;
    }),
  async (req: customRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    const image = req.file;
    if (errors.length > 0) {
      if (image) {
        await removeFiles(image.filename, null);
      }
      const error: any = createError(errors[0]?.msg, 400, errorCode.invalid);
      return next(error);
    }

    const { title, content, body, category, type, tags } = req.body;

    checkUploadFile(image);
    const user = req.user;
    checkUserIfNotExistsRemoveFile(user, image!.filename);

    const splitFileName = image!.filename.split(".")[0];

    await ImageQueue.add(
      "optimize_img",
      {
        filePath: req.file?.path,
        fileName: `${splitFileName}.webp`,
        width: 835,
        height: 577,
        quality: 100,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    );

    const data: PostArgs = {
      title,
      content,
      body,
      image: image!.filename,
      authorId: user!.id,
      category,
      type,
      tags,
    };

    const post = await createOnePost(data);

    res
      .status(201)
      .json({ message: "Post created successfully.", postId: post.id });
  },
];

export const updatePost = [
  body("postId", "Post Id is required.").isInt({ min: 1 }),
  body("title", "Title is required").trim().notEmpty().escape(),
  body("content", "Content is required").trim().notEmpty().escape(),
  body("body", "Body is required")
    .trim()
    .notEmpty()
    .customSanitizer((value) => sanitizeHtml(value))
    .notEmpty(),
  body("category", "Category is required.").trim().notEmpty().escape(),
  body("type", "Type is required.").trim().notEmpty().escape(),
  body("tags", "Tag is invalid.")
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value) {
        return value.split(",").filter((tag: string) => tag.trim() !== "");
      }
      return value;
    }),
  async (req: customRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    const image = req.file;

    if (errors.length > 0) {
      if (image) {
        await removeFiles(image.filename, null);
      }
      const error: any = createError(errors[0]?.msg, 400, errorCode.invalid);
      return next(error);
    }

    const user = req.user;
    checkUserIfNotExistsRemoveFile(user, image?.filename);

    const { postId, title, content, body, category, type, tags } = req.body;

    const post = await getPostById(+postId);
    if (!post) {
      if (image!.filename) {
        removeFiles(image!.filename);
      }
      return next(
        createError("This data modal doesn't exit", 401, errorCode.invalid),
      );
    }

    if (user.id !== post.authorId) {
      if (image!.filename) {
        removeFiles(image!.filename);
      }
      return next(
        createError("This action is not allowed", 403, errorCode.unauthorised),
      );
    }

    let data: any = {
      title,
      content,
      body,
      image: image?.filename,
      category,
      type,
      tags,
    };

    if (image) {
      data.image = image?.filename;
      const splitFileName = image?.filename.split(".")[0];

      await ImageQueue.add(
        "optimize_img",
        {
          filePath: req.file?.path,
          fileName: `${splitFileName}.webp`,
          width: 835,
          height: 577,
          quality: 100,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
        },
      );

      const optimizedFile = post.image.split(".")[0] + ".webp";
      await removeFiles(post.image, optimizedFile);
    }

    const postUpdated = await updateOnePost(post.id, data);
    res.status(200).json({
      message: "Successfully updated the post",
      postId: postUpdated.id,
    });
  },
];
export const deletePost = [
  body("postId", "Post Id is required.").isInt({ gt: 0 }),
  async (req: customRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = createError(errors[0]?.msg, 400, errorCode.invalid);
      return next(error);
    }
  },
];
