import {
  getProduct,
  getProductsByPagination,
} from "../../../controllers/api/ProductController";
import { auth } from "../../../middlewares/auth";
import { createRouter } from "../../createRouter";

const router = createRouter();

router.get("/", auth, getProductsByPagination); // offset pagination
router.get("/:id", auth, getProduct);

export default router;
