import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { errorCode } from "../../../config/errorCode";
import { checkUploadFile } from "../../utils/check";
import { createError } from "../../utils/error";
import ImageQueue from "../../jobs/queues/imageQueue";
import {
  createOneProduct,
  deleteOneProduct,
  getProductById,
  updateOneProduct,
} from "../../services/productServices";
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
  body("discount", "Discount must be integer")
    .isFloat({ min: 0 })
    .isDecimal({ decimal_digits: "1,2" }),
  body("inventory", "inventory is required").isInt({ min: 1 }),
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
      images.map(async (image: any) => {
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
    res.status(201).json({
      message: "Product created successfully.",
      productId: product.id,
    });
  },
];

export const updateProduct = [
  body("productId", "ProductId is required").isInt({ gt: 0 }),
  body("name", "Name is required").trim().notEmpty().escape(),
  body("description", "Description is required").trim().notEmpty().escape(),
  body("price", "Price is required")
    .isFloat({ min: 0.1 })
    .isDecimal({ decimal_digits: "1,2" }),
  body("discount", "Discount must be integer")
    .isFloat({ min: 0 })
    .isDecimal({ decimal_digits: "1,2" }),
  body("inventory", "inventory is required").isInt({ min: 1 }),
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
      productId,
      name,
      description,
      price,
      discount,
      inventory,
      category,
      type,
      tags,
    } = req.body;

    const product = await getProductById(+productId);
    if (!product) {
      if (images && images.length > 0) {
        const orgFiles = images.map((file: any) => file.filename);
        await removeManyFiles(orgFiles, null);
      }
      return next(
        createError("This data modal doesn't exit", 401, errorCode.invalid),
      );
    }

    let orgFileName = [];
    if (images && images.length > 0) {
      orgFileName = images.map((img: any) => ({ path: img.filename }));
    }
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

    if (images && images.length > 0) {
      await Promise.all(
        images.map(async (image: any) => {
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

      const orgFiles = product.images.map((img) => img.path);
      const optFiles = product.images.map(
        (img) => img.path.split(".")[0] + ".webp",
      );
      await removeManyFiles(orgFiles, optFiles);
    }

    const productUpdated = await updateOneProduct(product.id, data);

    await clearProductCache();

    res.status(200).json({
      message: "Successfully updated the product",
      postId: productUpdated.id,
    });
  },
];

export const deleteProduct = [
  body("productId", "Product Id is required.").isInt({ gt: 0 }),
  async (req: customRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = createError(errors[0]?.msg, 400, errorCode.invalid);
      return next(error);
    }

    const { productId } = req.body;
    const product = await getProductById(+productId);
    if (!product) {
      return next(
        createError("This data modal doesn't exit", 401, errorCode.invalid),
      );
    }

    if (product.images && product.images.length > 0) {
      const orgFiles = product.images.map((img) => img.path);
      const optFiles = product.images.map(
        (img) => img.path.split(".")[0] + ".webp",
      );
      await removeManyFiles(orgFiles, optFiles);
    }

    const productDeleted = await deleteOneProduct(product.id);

    await clearProductCache();

    res.status(200).json({
      message: "Post deleted successfully",
      postId: productDeleted.id,
    });
  },
];
