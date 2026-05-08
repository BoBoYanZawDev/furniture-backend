import { Request} from "express";
import multer, { FileFilterCallback } from "multer";


const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type =  file.mimetype.split("/")[1];
    if (type === "pdf") {
      cb(null, "uploads/documents");
    } else {
      cb(null, "uploads/images");
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const fileFilter = function (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) {
  const allowedTypes = ["image/jpeg","image/jpg","image/webp" ,"image/png", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: fileStorage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export default upload;
