import { Worker } from "bullmq";
import { redis, redisConfig } from "../../../config/redisClient";
import logger from "../../utils/logger";

const cacheWorker = new Worker(
  "cache-invalidation",
  async (job) => {
    const { pattern } = job.data;
    await invalidateCache(pattern);
  },
  {
    connection: redisConfig.connection,
    concurrency: 5,
  },
);

cacheWorker.on("completed", (job) => {
  logger.info(`Job with ID ${job.id} has been completed.`);
  console.log(`Job with ID ${job.id} has been completed.`);
});

cacheWorker.on("failed", (job: any, err) => {
  logger.error(`Job with ID ${job?.id} has failed. Error: ${err.message}`);
  console.error(`Job with ID ${job?.id} has failed. Error: ${err.message}`);
});

const invalidateCache = async (pattern: string) => {
  try {
    const stream = redis.scanStream({
      match: pattern,
      count: 100,
    });

    const pipeline = redis.pipeline();
    let totalKeys = 0;

    // Process keys in batch
    stream.on("data", (keys: string[]) => {
      if (keys.length > 0) {
        keys.forEach((key) => {
          pipeline.del(key);
          totalKeys++;
        });
      }
    });

    // wrap stream event in a promise
    await new Promise<void>((resolve, reject) => {
      stream.on("end", async () => {
        try {
          if (totalKeys > 0) {
            await pipeline.exec();
            console.log(`Invalidated ${totalKeys} keys`);
          }
          resolve();
        } catch (exeError) {
          console.error("Invalidated Error Occour", exeError);
          reject(exeError);
        }
      });

      stream.on("error", (error) => reject(error));
    });
  } catch (err) {
    console.error("Cache invalidation error ", err);
    throw err;
  }
};

export default cacheWorker;
