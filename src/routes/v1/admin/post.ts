import {
  createPost,
  deletePost,
  updatePost,
} from "../../../controllers/admin/PostController";
import upload from "../../../middlewares/uploadFile";
import { createRouter } from "../../createRouter";

const router = createRouter();

router.post("/posts", upload.single("image"), createPost);
router.patch("/posts", upload.single("image"), updatePost);
router.delete("/posts", deletePost);

export default router;
