import authRouter from "./auth";
import userRouter from "./admin/user";
import { createRouter } from "../createRouter";
import profileRouter from "../v1/api/user";
import { auth } from "../../middlewares/auth";

export const router = createRouter();

router.use("/api/v1", authRouter);
router.use("/api/v1/admin", auth, userRouter);
router.use("/api/v1", profileRouter);

export default router;
