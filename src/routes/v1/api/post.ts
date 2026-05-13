import {
  getPost,
  getPostsByPagination,
  getInfinitePostsByPagination
} from "../../../controllers/api/PostController";
import { auth } from "../../../middlewares/auth";
import { createRouter } from "../../createRouter";

const router = createRouter();

router.get("/", auth, getPostsByPagination);
router.get("/infinite", auth, getInfinitePostsByPagination);
router.get("/:id", auth, getPost);

export default router;
