import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";
import { limiter } from "./middlewares/rateLimiter";
import { Request, Response, NextFunction } from "express";
import HealthRouters from "./routes/v1/health";

export const app = express();

app
  .use(morgan("dev"))
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use(cors())
  .use(compression())
  .use(helmet())
  .use(limiter);

app.use("/api/v1", HealthRouters);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || "Server Error";
  const errCode = err.code || "Error Code";
  res.status(status).json({
    message,
    error: errCode,
  });
});
