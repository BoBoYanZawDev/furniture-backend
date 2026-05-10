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
