import { Request, Response, NextFunction } from "express";
import { param, query, validationResult } from "express-validator";
import { createError } from "../../utils/error";
import { errorCode } from "../../../config/errorCode";
import { getOrSetCache } from "../../utils/cache";
import { getCategoryList } from "../../services/categoryServices";
import { getTypeList } from "../../services/typeServices";
import { getUserById } from "../../services/authServices";
import { checkUserIfNotExists } from "../../utils/auth";
import { customRequest } from "./PostController";

export const getMasterData = [
  query("modelType")
    .optional()
    .custom((value) => {
      const allowedTypes = ["types", "categories"];
      const values = Array.isArray(value) ? value : [value];

      return values.every((item) => allowedTypes.includes(item));
    })
    .withMessage("Invalid model type."),
  async (req: customRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = createError(errors[0]?.msg, 400, errorCode.invalid);
      return next(error);
    }

    const userId = req.userId;
    const user = await getUserById(userId!);
    checkUserIfNotExists(user);

    const options = {
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    };

    const masterDataMap = {
      categories: () =>
        getOrSetCache("categories", () => getCategoryList(options)),

      types: () => getOrSetCache("types", () => getTypeList(options)),
    };

    type MasterDataType = keyof typeof masterDataMap;

    const { modelType } = req.query;

    const requestedTypes: MasterDataType[] = modelType
      ? Array.isArray(modelType)
        ? (modelType as MasterDataType[])
        : [modelType as MasterDataType]
      : (Object.keys(masterDataMap) as MasterDataType[]);

    const entries = await Promise.all(
      requestedTypes.map(async (type: keyof typeof masterDataMap) => [
        type,
        await masterDataMap[type](),
      ]),
    );

    const masterData = Object.fromEntries(entries);

    res.status(200).json({
      message: "Data fetched successfully.",
      masterData,
    });
  },
];
