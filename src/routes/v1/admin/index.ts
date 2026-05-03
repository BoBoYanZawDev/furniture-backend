import { setMaintenance } from "../../../controllers/admin/SystemController";
import { getAllUsers } from "../../../controllers/admin/UserController";
import { createRouter } from "../../createRouter";


export const router = createRouter();

router.get("/users", getAllUsers);
router.post("/maintenance",setMaintenance);

export default router;
