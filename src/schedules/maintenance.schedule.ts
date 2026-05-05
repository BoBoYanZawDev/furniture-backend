import { createOrUpdateSettingStatus, getSettingStatus } from "../services/settingServices";
import cron from "node-cron";


export const startMaintenanceSchedule = () => {
  cron.schedule("* * * * *", async () => {
    console.log("Running a task every  minutes");
    // You can call your function here to perform the desired task
    const setting = await getSettingStatus("maintenance");
    if (setting && setting.value === "true") {
      await createOrUpdateSettingStatus("maintenance", "false");
      console.log("Maintenance mode turned off automatically.");
    }
  });
};
