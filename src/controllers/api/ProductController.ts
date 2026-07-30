import { Request, Response, NextFunction } from "express";
import { param, query, validationResult } from "express-validator";
import { errorCode } from "../../../config/errorCode";
import { createError } from "../../utils/error";
import { getOrSetCache } from "../../utils/cache";
import { checkModelIfExist } from "../../utils/check";
import {
  getProductsList,
  getProductWithRelations,
} from "../../services/productServices";

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
  query("cursor", "Cursor must be Post ID.").isInt({ gt: 0 }).optional(),
  query("limit", "Limit number must be unsigned integer.")
    .isInt({ gt: 0 })
    .optional(),
  async (req: customRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = createError(errors[0]?.msg, 400, errorCode.invalid);
      return next(error);
    }

    const lastCursor = req.query.cursor;
    const limit = req.query.limit || 5;
    const category = req.query.category;
    const type = req.query.type;

    let categories: number[] = [];
    let types: number[] = [];
    if (category) {
      categories = category
        .toString()
        .split(",")
        .map((cat) => Number(cat))
        .filter((c) => c > 0);
    }

    if (type) {
      types = type
        .toString()
        .split(",")
        .map((ty) => Number(ty))
        .filter((t) => t > 0);
    }

    const where = {
      AND: [
        categories.length > 0 ? { categoryId: { in: categories } } : {},
        types.length > 0 ? { typeId: { in: types } } : {},
      ],
    };

    const options = {
      where,
      take: +limit + 1,
      skip: lastCursor ? 1 : 0,
      cursor: lastCursor ? { id: +lastCursor } : undefined,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        discount: true,
        status: true,
        images: {
          select: {
            id: true,
            path: true,
          },
          take: 1, // Limit to the first image
        },
      },
      orderBy: {
        id: "desc",
      },
    };

    const cacheKey = `products:${JSON.stringify(req.query)}`;
    const products = await getOrSetCache(
      cacheKey,
      async () => await getProductsList(options),
    );
    const hasNextPage = products.length > +limit;

    if (hasNextPage) {
      products.pop();
    }

    const nextCursor =
      products.length > 0 ? products[products.length - 1]?.id : null;
      
    res.status(200).json({
      message: "Products fetched successfully.",
      products,
      hasNextPage,
      nextCursor,
      prevCursor : lastCursor
    });
  },
];
