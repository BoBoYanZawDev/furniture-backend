import { redis } from "../../config/redisClient";
import cacheQueue from "../jobs/queues/cacheQueue";

export const getOrSetCache = async (key: any, cb: any) => {
  try {
    const cachedData = await redis.get(key);
    if (cachedData) {
      // console.log("Cache Hit");
      return JSON.parse(cachedData);
    }
    const freshData = await cb();
    await redis.setex(key, 3600, JSON.stringify(freshData)); //cache for 1 hour
    return freshData;
  } catch (err) {
    console.log("Redis Error : ", err);
    throw err;
  }
};

export const clearPostCache = async () => {
  await cacheQueue.add(
    "invalidate-post-cache",
    {
      pattern: "posts:*",
    },
    {
      jobId: `invalidate-${Date.now()}`,
      priority: 1,
    },
  );
};

export const clearProductCache = async () => {
  await cacheQueue.add(
    "invalidate-product-cache",
    {
      pattern: "products:*",
    },
    {
      jobId: `invalidate-${Date.now()}`,
      priority: 1,
    },
  );
};