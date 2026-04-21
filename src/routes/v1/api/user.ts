import { changeLanguage } from "../../../controllers/api/ProfileController";
import { createRouter } from "../../createRouter";

export const router = createRouter();

router.post("/change-language", changeLanguage);

export default router;
