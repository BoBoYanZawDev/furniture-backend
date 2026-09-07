import {
  getProduct,
  getProductsByPagination,
  toggleFavouriteProduct,
} from "../../../controllers/api/ProductController";
import { auth } from "../../../middlewares/auth";
import { createRouter } from "../../createRouter";

const router = createRouter();

router.get("/", auth, getProductsByPagination); // offset pagination
router.get("/:id", auth, getProduct);
router.patch('/toggle-favourite/:id', auth, toggleFavouriteProduct);
export default router;
