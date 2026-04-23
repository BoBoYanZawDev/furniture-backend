import authRoutes from "./auth";
import adminRoutes from "./admin";
import { createRouter } from "../createRouter";
import userRoutes from "./api";
import { auth } from "../../middlewares/auth";
import { authorise } from "../../middlewares/authorise";

export const router = createRouter();

router.use("/api/v1", authRoutes);
router.use("/api/v1/user", userRoutes);
router.use("/api/v1/admin", auth, authorise(true, "ADMIN"), adminRoutes);

export default router;
