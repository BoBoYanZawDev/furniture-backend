import { errorCode } from "../../config/errorCode";
import { createError } from "./error";

export const checkUploadFile = (file: any) => {
  if (!file) {
    const error: any = createError("Invalid Images",409,errorCode.invalid);
    throw error;
  }
};