import authRouter from "./auth";
import userRouter from "./admin/user";
import { createRouter } from "../createRouter";
import { auth } from "../../middlewares/auth";

export const router = createRouter();

router.use("/api/v1", authRouter);
router.use("/api/v1/admin", auth, userRouter);

export default router;
