import { Redis } from "ioredis";

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  //   password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

export default redisConnection;