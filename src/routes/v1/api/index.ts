import { createRouter } from "../../createRouter";
import postRouters from "./post";
import productRouters from "./product";
import profileRouters from "./profile" ;
import masterRouters from "./master" ;


const router = createRouter();

router.use(profileRouters);

router.use("/posts", postRouters);

router.use("/products", productRouters);

router.use("/filter-type",masterRouters);

export default router;
