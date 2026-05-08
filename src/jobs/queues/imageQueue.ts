import { Queue } from "bullmq";
// import {redisConnection} from "../../config/redis";
import { Redis } from "ioredis";

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  password: process.env.REDIS_PASSWORD,
});

const ImageQueue = new Queue("imageQueue", {
  connection: redisConnection,
});

export default ImageQueue;