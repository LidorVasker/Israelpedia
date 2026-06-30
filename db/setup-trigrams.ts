/**
 * One-time setup: enable pg_trgm extension and create GIN trigram indexes
 * used by the deduplication system.
 *
 * Run once against the Neon database:
 *   npx tsx db/setup-trigrams.ts
 *
 * Safe to re-run — all statements use IF NOT EXISTS / CONCURRENTLY.
 */
import "dotenv/config";
import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

  console.log("Enabling pg_trgm extension…");
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
  console.log("  ✓ pg_trgm");

  console.log("Creating GIN trigram indexes…");

  await sql`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS articles_title_trgm_idx
    ON articles USING gin (title gin_trgm_ops)
  `;
  console.log("  ✓ articles.title");

  await sql`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS articles_title_he_trgm_idx
    ON articles USING gin (title_he gin_trgm_ops)
  `;
  console.log("  ✓ articles.title_he");

  await sql`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS suggestions_topic_trgm_idx
    ON suggestions USING gin (topic gin_trgm_ops)
  `;
  console.log("  ✓ suggestions.topic");

  await sql.end();
  console.log("\nDone. Trigram similarity search is now active.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
