import { unlink } from "node:fs/promises";
import path from "path";

export const removeFiles = async (
  orgFile: string,
  optimizedFile?: string | null,
) => {
  try {
    const orgFilePath = path.join(
      __dirname,
      "../../..",
      "/uploads/images",
      orgFile,
    );
    await unlink(orgFilePath);

    if (optimizedFile) {
      const optimizedFilePath = path.join(
        __dirname,
        "../../..",
        "/uploads/optimize_img",
        optimizedFile,
      );
      await unlink(optimizedFilePath);
    }
  } catch (err) {
    console.error("Error deleting file:", err);
  }
};

export const removeManyFiles = async (
  orgFiles: string[],
  optimizedFiles?: string[] | null,
) => {
  try {
    for (const orgFile of orgFiles) {
      const orgFilePath = path.join(
        process.cwd(),
        "uploads",
        "images",
        orgFile,
      );
      await unlink(orgFilePath);
    }

    if (optimizedFiles && optimizedFiles.length > 0) {
      for (const optimizedFile of optimizedFiles) {
        const optimizedFilePath = path.join(
          process.cwd(),
          "uploads",
          "optimize_img",
          optimizedFile,
        );
        await unlink(optimizedFilePath);
      }
    }
  } catch (err) {
    console.error("Error deleting file:", err);
  }
};
