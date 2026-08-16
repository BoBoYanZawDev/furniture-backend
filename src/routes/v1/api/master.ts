import { getMasterData } from "../../../controllers/api/MasterController";
import { auth } from "../../../middlewares/auth";
import { createRouter } from "../../createRouter";

const router = createRouter();

router.get("/", auth , getMasterData); 

export default router;