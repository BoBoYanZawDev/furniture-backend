import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";
import { limiter } from "./middlewares/rateLimiter";
import { Request, Response, NextFunction } from "express";
// import WebRouters from "./routes/v1/web/view";
// import * as errorController from "./controllers/web/ErrorController";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import middleware from "i18next-http-middleware";
import router from "./routes/v1";
import cookieParser from "cookie-parser";
import path from "path";
import { schedulesProvider } from "./schedules";
import logger from "./utils/logger";

export const app = express();

app.set("view engine", "ejs");
app.set("views", "./src/views");

const whitelist = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Mobile app, Postman, curl
    if (!origin) {
      return callback(null, true);
    }

    // Allow all origins
    if (whitelist.includes("*")) {
      return callback(null, true);
    }

    // Allow only whitelist
    if (whitelist.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,
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

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    backend: {
      loadPath: path.join(
        process.cwd(),
        "src/locales",
        "{{lng}}",
        "{{ns}}.json",
      ),
    },
    detection: {
      order: ["querystring", "cookie"],
      caches: ["cookie"],
    },
    fallbackLng: "en",
    preload: ["en", "mm"],
  });

app.use(middleware.handle(i18next));

app.use(express.static("public"));
app.use(express.static("uploads"));

app.use(router);

// for web routes
// app.use(WebRouters);
// app.use(errorController.notFound);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || "Server Error";
  const errCode = err.code || "Error Code";

  logger.error(err.message, {
    method: req.method,
    url: req.originalUrl,
    stack: err.stack,
  });
  
  res.status(status).json({
    message,
    error: errCode,
  });
});

// schedule tasks
schedulesProvider();
