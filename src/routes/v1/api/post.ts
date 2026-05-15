import {
  getPost,
  getPostsByPagination,
  getInfinitePostsByPagination,
} from "../../../controllers/api/PostController";
import { auth } from "../../../middlewares/auth";
import { createRouter } from "../../createRouter";

const router = createRouter();

router.get("/", auth, getPostsByPagination); // offset pagination
router.get("/infinite", auth, getInfinitePostsByPagination); // cursor base pagination
router.get("/:id", auth, getPost);

export default router;
