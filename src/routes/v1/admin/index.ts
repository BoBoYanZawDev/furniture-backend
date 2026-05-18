import { setMaintenance } from "../../../controllers/admin/SystemController";
import { getAllUsers } from "../../../controllers/admin/UserController";
import { createRouter } from "../../createRouter";
import postRoutes from "../admin/post";
import productRoutes from "../admin/product";

const router = createRouter();

router.get("/users", getAllUsers);
router.post("/maintenance", setMaintenance);

// post route
router.use("/posts", postRoutes);

// product route
router.use("/products", productRoutes);

export default router;
