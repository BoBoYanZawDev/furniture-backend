import {
  getPost,
  getPostsByPagination,
} from "../../../controllers/api/PostController";
import { auth } from "../../../middlewares/auth";
import upload from "../../../middlewares/uploadFile";
import { createRouter } from "../../createRouter";

const router = createRouter();

router.get("/posts", auth, getPostsByPagination);
router.get("/posts/:id", auth, getPost);

export default router;
