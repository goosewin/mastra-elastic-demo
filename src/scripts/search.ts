import "dotenv/config";
import { esVector, INDEX } from "../lib/elastic-store.js";
import { embeddingModel } from "../lib/embedding.js";

const query = process.argv.slice(2).join(" ").trim() || "first contact with UFOs";

const { embeddings } = await embeddingModel.doEmbed({ values: [query] });

const results = await esVector.query({
  indexName: INDEX,
  queryVector: embeddings[0]!,
  topK: 5,
});

console.log(`\n"${query}" → top ${results.length}:\n`);
for (const r of results) {
  const m = (r.metadata ?? {}) as { title?: string; year?: number };
  console.log(`  ${r.score.toFixed(3)}  ${m.title ?? "(unknown)"} (${m.year ?? "?"})`);
}
