import { redis } from "../../config/redisClient";

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
