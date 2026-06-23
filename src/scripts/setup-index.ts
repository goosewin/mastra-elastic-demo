import "dotenv/config";
import { esVector, INDEX } from "../lib/elastic-store.js";
import { EMBED_DIMS } from "../lib/embedding.js";

const recreate = process.argv.includes("--recreate");

if (recreate) {
  await esVector.deleteIndex({ indexName: INDEX }).catch(() => {});
}

try {
  await esVector.createIndex({ indexName: INDEX, dimension: EMBED_DIMS, metric: "cosine" });
  console.log(`Index "${INDEX}" ready (${EMBED_DIMS} dims, cosine).`);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  if (/exist/i.test(msg)) console.log(`Index "${INDEX}" already exists.`);
  else throw err;
}
