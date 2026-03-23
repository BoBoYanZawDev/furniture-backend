import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";
import { limiter } from "./middlewares/rateLimiter";
import { check, customRequest } from "./middlewares/check";

export const app = express();

app
  .use(morgan("dev"))
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use(cors())
  .use(compression())
  .use(helmet())
  .use(limiter);

app.get("/health", check, (req: customRequest, res) => {
  res.status(200).json({
    message: "Hello we are ready for sending response",
    userId: req.userId,
  });
});
