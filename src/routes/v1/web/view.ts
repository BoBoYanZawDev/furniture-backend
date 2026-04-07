import { about, home } from "../../../controllers/web/ViewController";
import { createRouter } from "../../createRouter";

export const router = createRouter();

router.get("/home", home);
router.get("/about", about);

export default router;
