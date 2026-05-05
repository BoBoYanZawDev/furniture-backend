import {
  changeLanguage,
  testPermission,
  uploadProfile,
} from "../../../controllers/api/ProfileController";
import { auth } from "../../../middlewares/auth";
import upload from "../../../middlewares/uploadFile";
import { createRouter } from "../../createRouter";

export const router = createRouter();

router.post("/change-language", changeLanguage);

router.post("/test-permission", auth, testPermission);

router.patch("/profile/upload",auth , upload.single("avatar") ,uploadProfile);


export default router;
