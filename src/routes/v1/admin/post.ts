import {
  createPost,
  deletePost,
  updatePost,
} from "../../../controllers/admin/PostController";
import upload from "../../../middlewares/uploadFile";
import { createRouter } from "../../createRouter";

const router = createRouter();

router.post("/", upload.single("image"), createPost);
router.patch("/", upload.single("image"), updatePost);
router.delete("/", deletePost);

export default router;
