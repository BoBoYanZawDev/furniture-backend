import {
  confirmPassword,
  forgetPassword,
  login,
  logout,
  register,
  resetPassword,
  verifyOtp,
  verifyOTPForPassword,
} from "../../controllers/AuthController";
import { createRouter } from "../createRouter";

export const router = createRouter();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/confirm-password", confirmPassword);
router.post("/login", login);
router.post("/logout", logout);

// for forgetpassword
router.post("/forget-password", forgetPassword);
router.post("/forget-password/verify", verifyOTPForPassword);
router.post("/reset-password", resetPassword);

export default router;
