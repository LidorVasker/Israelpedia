import { runDiscovery } from "./agents/discovery";
import { runDiscoveryBasic } from "./agents/discovery-basic";
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
    await runDiscoveryBasic();
  } catch (err) {
    console.error("[Pipeline] DiscoveryBasic agent failed:", err);
  }

  try {
    await runTriage();
  } catch (err) {
    console.error("[Pipeline] Triage agent failed:", err);
  }

  try {
    await runDrafting();
  } catch (err) {
    console.error("[Pipeline] Drafting agent failed:", err);
  }

  console.log("=== Pipeline run complete ===\n");
}
