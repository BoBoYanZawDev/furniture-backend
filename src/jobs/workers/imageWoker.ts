import { Worker } from "bullmq";
import sharp from "sharp";
import path from "path";
import { redisConfig } from "../../../config/redisClient";
import logger from "../../utils/logger";

const imageWorker = new Worker(
  "imageQueue",
  async (job) => {
    const { filePath, fileName, width, height, quality } = job.data;

    const optimizedImagePath = path.join(
      __dirname,
      "../../..",
      "/uploads/optimize_img",
      fileName,
    );

    await sharp(filePath)
      .resize(width, height, { fit: "cover" })
      .png({ quality })
      .toFile(optimizedImagePath);
  },
  // { connection: redis},
  {
    connection: redisConfig.connection,
  },
);

imageWorker.on("completed", (job) => {
  logger.info(`Job with ID ${job.id} has been completed.`);
  console.log(`Job with ID ${job.id} has been completed.`);
});

imageWorker.on("failed", (job: any, err) => {
  logger.error(`Job with ID ${job?.id} has failed. Error: ${err.message}`);
  console.error(`Job with ID ${job?.id} has failed. Error: ${err.message}`);
});

export default imageWorker;
