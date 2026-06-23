import "dotenv/config";
import { esVector, INDEX } from "../lib/elastic-store.js";
import { embedMany, EMBED_DIMS } from "../lib/embedding.js";
import { movies } from "../data/movies.js";

const slug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

await esVector
  .createIndex({ indexName: INDEX, dimension: EMBED_DIMS, metric: "cosine" })
  .catch(() => {});

const texts = movies.map((m) => `${m.title}. ${m.description}`);
const vectors = await embedMany(texts);

await esVector.upsert({
  indexName: INDEX,
  vectors,
  metadata: movies.map((m) => ({ ...m })),
  ids: movies.map((m) => slug(m.title)),
});

console.log(`Upserted ${movies.length} movies into "${INDEX}".`);
