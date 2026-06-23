import "dotenv/config";
import { Mastra } from "@mastra/core/mastra";
import { elasticsearchAgent } from "./agents/elasticsearch-agent.js";
import { esVector } from "../lib/elastic-store.js";
import { storage } from "../lib/storage.js";

export const mastra = new Mastra({
  agents: { elasticsearchAgent },
  vectors: { elasticsearch: esVector },
  storage,
});
