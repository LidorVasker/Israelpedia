import dotenv from "dotenv";
dotenv.config();

import cron from "node-cron";
import { runPipeline } from "./pipeline";

const SCHEDULE = "0 */6 * * *"; // 00:00, 06:00, 12:00, 18:00

console.log("Worker started.");
console.log(`Pipeline scheduled: every 6 hours (${SCHEDULE})`);

// Run once immediately on startup, then on schedule
runPipeline().catch((err) => console.error("[Startup] Pipeline failed:", err));

cron.schedule(SCHEDULE, () => {
  runPipeline().catch((err) => console.error("[Cron] Pipeline failed:", err));
});
