import authRouter from "./auth";
import { createRouter } from "../createRouter";

export const router = createRouter();

router.use("/api/v1", authRouter);

export default router;
