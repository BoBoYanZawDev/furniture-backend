import {
  getPost,
  getPostsByPagination,
} from "../../../controllers/api/PostController";
import { auth } from "../../../middlewares/auth";
import { createRouter } from "../../createRouter";

const router = createRouter();

router.get("/", auth, getPostsByPagination);
router.get("/:id", auth, getPost);

export default router;
