import { getMasterData } from "../../../controllers/api/MasterController";
import { createRouter } from "../../createRouter";

const router = createRouter();

router.get("/", getMasterData); 

export default router;