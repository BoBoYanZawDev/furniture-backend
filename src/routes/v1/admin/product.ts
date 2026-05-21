import {
  createProduct,
  // deleteProduct,
  updateProduct,
} from "../../../controllers/admin/ProductController";
import upload from "../../../middlewares/uploadFile";
import { createRouter } from "../../createRouter";

const router = createRouter();

router.post("/", upload.array("images",5), createProduct);
router.patch("/", upload.array("images",5), updateProduct);
// router.delete("/", deleteProduct);

export default router;
