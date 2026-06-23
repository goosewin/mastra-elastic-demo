import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { hybridSearchTool } from "../tools/hybrid-search-tool.js";
import { storage } from "../../lib/storage.js";

export const elasticsearchAgent = new Agent({
  id: "elasticsearch-agent",
  name: "Elasticsearch Agent",
  instructions: `You answer questions about sci-fi movies using the searchMovies tool.

Always search before answering. Rewrite the request into a focused query; if a year
range is given, pass minYear/maxYear. The tool fuses keyword and semantic search and
returns ranked matches — treat them as the answer; do not reject them for missing the
user's exact words. Return the requested count (default 5) as "Title (Year)" with a
one-line reason. If the results are empty, say so; never invent a title.`,
  model: "openai/gpt-5.4-nano",
  tools: { searchMovies: hybridSearchTool },
  memory: new Memory({ storage }),
});
