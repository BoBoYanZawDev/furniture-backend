import { setMaintenance } from "../../../controllers/admin/SystemController";
import { getAllUsers } from "../../../controllers/admin/UserController";
import { createRouter } from "../../createRouter";
import postRoutes from "../admin/post";

const router = createRouter();

router.get("/users", getAllUsers);
router.post("/maintenance", setMaintenance);

// post route
router.use("/posts", postRoutes);

export default router;
