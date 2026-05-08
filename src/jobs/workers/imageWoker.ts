import { Worker } from "bullmq";
import { Redis } from "ioredis";
import sharp from "sharp";
import path from "path";

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  //   password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

const imageWorker = new Worker(
  "imageQueue",
  async (job) => {
    const { filePath, fileName } = job.data;

    const optimizedImagePath = path.join(
      __dirname,
      "../../..",
      "/uploads/optimize_img",
      fileName,
    );

    await sharp(filePath)
      .resize(200, 200, { fit: "cover" })
      .png({ quality: 75 })
      .toFile(optimizedImagePath);
  },
  { connection: redisConnection },
);

imageWorker.on("completed", (job) => {
  console.log(`Job with ID ${job.id} has been completed.`);
});

imageWorker.on("failed", (job: any, err) => {
  console.error(`Job with ID ${job?.id} has failed. Error: ${err.message}`);
});

export default imageWorker;
