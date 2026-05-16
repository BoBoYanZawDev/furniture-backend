import { Queue } from "bullmq";
import { redisConfig } from "../../../config/redisClient";

const cacheQueue = new Queue("cache-invalidation", {
  connection: redisConfig.connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: true,
  },
});

export default cacheQueue;
