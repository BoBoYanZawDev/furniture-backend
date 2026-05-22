import { Request, Response, NextFunction } from "express";
import { param, query, validationResult } from "express-validator";
import { errorCode } from "../../../config/errorCode";
import { createError } from "../../utils/error";
import {
  getPostsList,
} from "../../services/postServices";
import { getUserById } from "../../services/authServices";
import { getOrSetCache } from "../../utils/cache";
import { checkModelIfExist } from "../../utils/check";
import { getProductWithRelations } from "../../services/productServices";

export interface customRequest extends Request {
  userId?: number;
  user?: any;
}

export const getProduct = [
  param("id", "Product Id is required.").isInt({ gt: 0 }),
  async (req: customRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = createError(errors[0]?.msg, 400, errorCode.invalid);
      return next(error);
    }

    const productId = req.params.id;

    // cache operation
    const cacheKey = `products:${JSON.stringify(productId)}`;
    const product = await getOrSetCache(
      cacheKey,
      async () => await getProductWithRelations(+productId!),
    );

    checkModelIfExist(product);

    res.status(200).json({
      messaage: "Product fetched successfully",
      product,
    });
  },
];

// offest paginations
export const getProductsByPagination = [
  query("page", "Page number must be unsigned integer.")
    .isInt({ gt: 0 })
    .optional(),
  query("limit", "Limit number must be unsigned integer.")
    .isInt({ gt: 0 })
    .optional(),
  async (req: customRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = createError(errors[0]?.msg, 400, errorCode.invalid);
      return next(error);
    }

    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
    // const userId = req.userId;
    // const user = await getUserById(userId!);
    // checkUserIfNotExists(user);

    const skip = (+page - 1) * +limit;
    const options = {
      skip,
      take: +limit + 1,
      select: {
        id: true,
        title: true,
        content: true,
        body: true,
        image: true,
        updatedAt: true,
        author: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    };

    // const posts = await getPostsList(options);
    // cache operation
    const cacheKey = `posts:${JSON.stringify(req.query)}`;
    const posts = await getOrSetCache(
      cacheKey,
      async () => await getPostsList(options),
    );

    const hasNextPage = posts.length > +limit;

    let nextPage = null;
    const previousPage = +page !== 1 ? +page - 1 : null;

    if (hasNextPage) {
      posts.pop();
      nextPage = +page + 1;
    }

    res.status(200).json({
      message: "Data fetched successfully.",
      posts,
      currentPage: page,
      hasNextPage,
      nextPage,
      previousPage,
    });
  },
];

// infinte scroll
export const getInfiniteProductsByPagination = [
  query("cursor", "Page number must be unsigned integer.")
    .isInt({ gt: 0 })
    .optional(),
  query("limit", "Limit number must be unsigned integer.")
    .isInt({ gt: 4 })
    .optional(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = createError(errors[0]?.msg, 400, errorCode.invalid);
      return next(error);
    }

    const lastCursor = req.query.cursor;
    const limit = req.query.limit || 5;
    // const userId = req.userId;
    // const user = await getUserById(userId!);
    // checkUserIfNotExists(user);

    const options = {
      skip: lastCursor ? 1 : 0,
      take: +limit + 1,
      cursor: lastCursor ? { id: +lastCursor } : undefined,
      select: {
        id: true,
        title: true,
        content: true,
        body: true,
        image: true,
        updatedAt: true,
        author: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    };

    // const posts = await getPostsList(options);
    // cache operation
    const cacheKey = `posts:${JSON.stringify(req.query)}`;
    const posts = await getOrSetCache(
      cacheKey,
      async () => await getPostsList(options),
    );
    const hasNextPage = posts.length > +limit;

    if (hasNextPage) {
      posts.pop();
    }
    const newCursor = posts.length > 0 ? posts[posts.length - 1]?.id : null;
    res.status(200).json({
      message: "Get all infinite post.",
      posts,
      hasNextPage,
      newCursor,
    });
  },
];
