import { Queue } from "bullmq";
import { redisConfig } from "../../../config/redisClient";

const ImageQueue = new Queue("imageQueue", redisConfig);

export default ImageQueue;
