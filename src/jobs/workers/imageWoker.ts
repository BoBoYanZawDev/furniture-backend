import { Worker } from "bullmq";
import { Redis } from "ioredis";
import sharp from "sharp";
import path from "path";
import { redisConfig } from "../../../config/redisClient";

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
  // { connection: redis},
  {
    connection: redisConfig.connection,
  },
);

imageWorker.on("completed", (job) => {
  console.log(`Job with ID ${job.id} has been completed.`);
});

imageWorker.on("failed", (job: any, err) => {
  console.error(`Job with ID ${job?.id} has failed. Error: ${err.message}`);
});

export default imageWorker;
