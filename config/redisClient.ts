import { Redis } from "ioredis";

export const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  //   password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

export const redisConfig = {
  connection: {
    host: process.env.REDIS_HOST ?? "127.0.0.1",
    port: Number(process.env.REDIS_PORT ?? 6379),
  },
};
