import { Request, Response, NextFunction } from "express";
import { body, param, validationResult } from "express-validator";
import { errorCode } from "../../../config/errorCode";
import { createError } from "../../utils/error";
import { checkUserIfNotExists } from "../../utils/auth";
import { getPostWithRelations } from "../../services/postServices";
import { getUserById } from "../../services/authServices";

export interface customRequest extends Request {
  userId?: number;
  user?: any;
}

export const getPost = [
  param("id", "Post Id is required.").isInt({ gt: 0 }),
  async (req: customRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = createError(errors[0]?.msg, 400, errorCode.invalid);
      return next(error);
    }
    const userId = req.userId;
    const user = await getUserById(userId!);
    checkUserIfNotExists(user);

    const postId = req.params.id;
    const post = await getPostWithRelations(+postId!);
    const modifiedPost = {
      id: post?.id,
      title: post?.title,
      content: post?.content,
      body: post?.body,
      image: post?.image,
      updatedAt: post?.updatedAt,
      fullName: post?.author?.fullName,
      category_name: post?.category.name,
      type_name: post?.type.name,
      tags: post?.tags && post.tags.length > 0 ? post.tags.map((i) => i.name) : null,
    };

    res.status(200).json({
      messaage: "Post fetched successfully",
      post: modifiedPost,
    });
  },
];

export const getPostsByPagination = [
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = createError(errors[0]?.msg, 400, errorCode.invalid);
      return next(error);
    }
  },
];
export const getInfinitePostsByPagination = [
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = createError(errors[0]?.msg, 400, errorCode.invalid);
      return next(error);
    }
  },
];
