import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";
import { limiter } from "./middlewares/rateLimiter";
import { Request, Response, NextFunction } from "express";
import HealthRouters from "./routes/v1/health";
import WebRouters from "./routes/web/view";
import * as errorController from "./controllers/web/ErrorController";


export const app = express();

app.set("view engine", "ejs");
app.set("views", "./src/views");

app
  .use(morgan("dev"))
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use(cors())
  .use(compression())
  .use(helmet())
  .use(limiter);

app.use(express.static("public"));

app.use("/api/v1", HealthRouters);
app.use(WebRouters);

app.use(errorController.notFound);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || "Server Error";
  const errCode = err.code || "Error Code";
  res.status(status).json({
    message,
    error: errCode,
  });
});
