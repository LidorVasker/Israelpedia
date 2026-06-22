import { runDiscovery } from "./agents/discovery";
import { runTriage } from "./agents/triage";
import { runDrafting } from "./agents/drafting";

export async function runPipeline(): Promise<void> {
  console.log("\n=== Pipeline run starting ===");

  try {
    await runDiscovery();
  } catch (err) {
    console.error("[Pipeline] Discovery agent failed:", err);
  }

  try {
    await runTriage();
  } catch (err) {
    console.error("[Pipeline] Triage agent failed:", err);
  }

  // Drafting runs immediately after triage in the same pipeline tick,
  // so topics accepted by triage get drafted without waiting for the next run.
  try {
    await runDrafting();
  } catch (err) {
    console.error("[Pipeline] Drafting agent failed:", err);
  }

  console.log("=== Pipeline run complete ===\n");
}
