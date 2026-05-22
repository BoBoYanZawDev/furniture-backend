import { createRouter } from "../../createRouter";
import postRouters from "./post";
import productRouters from "./product";
import profileRouters from "./profile" ;


const router = createRouter();

router.use(profileRouters);

router.use("/posts", postRouters);

router.use("/products", productRouters);

export default router;
