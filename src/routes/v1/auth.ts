import {
  confirmPassword,
  login,
  logout,
  register,
  verifyOtp,
} from "../../controllers/AuthController";
import { createRouter } from "../createRouter";

export const router = createRouter();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/confirm-password", confirmPassword);
router.post("/login", login);
router.post("/logout", logout);

export default router;
