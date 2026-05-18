import {
  changeLanguage,
  changePassword,
  getMyPhoto,
  testPermission,
  uploadProfile,
  uploadProfileMultiple,
  uploadProfileOptimized,
  uploadProfileOptimizedWithQue,
} from "../../../controllers/api/ProfileController";
import { auth } from "../../../middlewares/auth";
import upload, { uploadMemory } from "../../../middlewares/uploadFile";
import { createRouter } from "../../createRouter";

const router = createRouter();

router.post("/change-language", changeLanguage);

router.post("/change-password", auth, changePassword);

router.post("/test-permission", auth, testPermission);

router.patch("/profile/upload", auth, upload.single("avatar"), uploadProfile);

router.patch(
  "/profile/upload/optimize",
  auth,
  uploadMemory.single("avatar"),
  uploadProfileOptimized,
); // optimized version for memory storage

router.patch(
  "/profile/upload/optimize-with-que",
  auth,
  upload.single("avatar"),
  uploadProfileOptimizedWithQue,
); // optimized version for memory storage

router.patch(
  "/profile/upload-multiple",
  auth,
  upload.array("avatars", 5),
  uploadProfileMultiple,
);

router.get("/profile/my-photo", getMyPhoto); // testing photo

export default router;
