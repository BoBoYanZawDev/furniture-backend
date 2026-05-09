import { createRouter } from "../../createRouter";
import postRouters from "./post";
import profileRouters from "./profile" ;


const router = createRouter();

router.use(profileRouters);

router.use(postRouters);

export default router;
