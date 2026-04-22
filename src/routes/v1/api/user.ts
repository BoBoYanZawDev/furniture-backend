import {
  changeLanguage,
  testPermission,
} from "../../../controllers/api/ProfileController";
import { auth } from "../../../middlewares/auth";
import { createRouter } from "../../createRouter";

export const router = createRouter();

router.post("/change-language", changeLanguage);

router.post("/test-permission", auth, testPermission);

export default router;
