import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";
import { limiter } from "./middlewares/rateLimiter";
import { Request, Response, NextFunction } from "express";
// import WebRouters from "./routes/v1/web/view";
// import * as errorController from "./controllers/web/ErrorController";
import router from "./routes/v1";
import cookieParser from "cookie-parser";

export const app = express();

app.set("view engine", "ejs");
app.set("views", "./src/views");

var whitelist = ["http://example1.com", "http://localhost:5173"];
var corsOptions = {
  origin: function (
    origin: any,
    callback: (err: Error | null, origin?: any) => void,
  ) {
    // Allow requests with no origin ( like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow cookies or authorization header
};

app
  .use(morgan("dev"))
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use(cookieParser())
  .use(cors(corsOptions))
  .use(compression())
  .use(helmet())
  .use(limiter);

app.use(express.static("public"));

app.use(router);

// for web routes
// app.use(WebRouters);
// app.use(errorController.notFound);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || "Server Error";
  const errCode = err.code || "Error Code";
  res.status(status).json({
    message,
    error: errCode,
  });
});
