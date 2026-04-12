import { getAllUsers } from "../../../controllers/admin/UserController";
import { createRouter } from "../../createRouter";


export const router = createRouter();

router.get("/users", getAllUsers);


export default router;
