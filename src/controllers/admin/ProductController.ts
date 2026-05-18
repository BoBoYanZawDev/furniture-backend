import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { errorCode } from "../../../config/errorCode";
import { checkUploadFile } from "../../utils/check";
import { createError } from "../../utils/error";
import ImageQueue from "../../jobs/queues/imageQueue";
import {
  checkUserIfNotExists,
  checkUserIfNotExistsRemoveFile,
} from "../../utils/auth";
import {
  createOneProduct,
  deleteOneProduct,
  getProductById,
  updateOneProduct,
} from "../../services/productServices";
import sanitizeHtml from "sanitize-html";
import { removeManyFiles } from "../../utils/helper";
import cacheQueue from "../../jobs/queues/cacheQueue";

export interface customRequest extends Request {
  userId?: number;
  user?: any;
  files?: any;
}

const clearProductCache = async () => {
  await cacheQueue.add(
    "invalidate-product-cache",
    {
      pattern: "products:*",
    },
    {
      jobId: `invalidate-${Date.now()}`,
      priority: 1,
    },
  );
};

export const createProduct = [
  body("name", "Name is required").trim().notEmpty().escape(),
  body("description", "Description is required").trim().notEmpty().escape(),
  body("price", "Price is required")
    .isFloat({ min: 0.1 })
    .isDecimal({ decimal_digits: "1,2" }),
  body("discount", "Discount is")
    .isFloat({ min: 0 })
    .isDecimal({ decimal_digits: "1,2" }),
  body("inventory", "Discount is").isInt({ min: 1 }),
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
    const images = req.files;
    if (errors.length > 0) {
      if (images && images.length > 0) {
        const orgFiles = images.map((file: any) => file.filename);
        await removeManyFiles(orgFiles, null);
      }
      const error: any = createError(errors[0]?.msg, 400, errorCode.invalid);
      return next(error);
    }

    const {
      name,
      description,
      price,
      discount,
      inventory,
      category,
      type,
      tags,
    } = req.body;

    checkUploadFile(images && images.length > 0);

    await Promise.all(
      images.forEach(async (image: any) => {
        const splitFileName = image!.filename.split(".")[0];
        return ImageQueue.add(
          "optimize_img",
          {
            filePath: image?.path,
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
      }),
    );

    const orgFileName = images.map((img: any) => ({ path: img.filename }));

    const data: any = {
      name,
      description,
      price,
      discount,
      inventory: +inventory,
      images: orgFileName,
      category,
      type,
      tags,
    };

    const product = await createOneProduct(data);

    await clearProductCache();
    res
      .status(201)
      .json({ message: "Product created successfully.", productId: product.id });
  },
];

export const updateProduct = [
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

    const post = await getProductById(+postId);
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

    const postUpdated = await updateOneProduct(post.id, data);

    await clearProductCache();

    res.status(200).json({
      message: "Successfully updated the post",
      postId: postUpdated.id,
    });
  },
];

export const deleteProduct = [
  body("postId", "Post Id is required.").isInt({ gt: 0 }),
  async (req: customRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = createError(errors[0]?.msg, 400, errorCode.invalid);
      return next(error);
    }

    const user = req.user;
    checkUserIfNotExists(user);

    const { postId } = req.body;
    const post = await getProductById(+postId);
    if (!post) {
      return next(
        createError("This data modal doesn't exit", 401, errorCode.invalid),
      );
    }

    if (user.id !== post.authorId) {
      return next(
        createError("This action is not allowed", 403, errorCode.unauthorised),
      );
    }

    removeFiles(post.image);
    const postDeleted = await deleteOneProduct(post.id);

    await clearProductCache();

    res.status(200).json({
      message: "Post deleted successfully",
      postId: postDeleted.id,
    });
  },
];
