import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { es, INDEX } from "../../lib/elastic-store.js";
import { embeddingModel } from "../../lib/embedding.js";

interface MovieSource {
  metadata: { title: string; year: number; director: string; description: string };
}

export const hybridSearchTool = createTool({
  id: "searchMovies",
  description:
    "Search the sci-fi movie knowledge base. Fuses keyword (BM25) and semantic " +
    "(vector) search with Reciprocal Rank Fusion. Pass a focused query; optionally " +
    "filter by release year.",
  inputSchema: z.object({
    query: z.string().describe("focused, rewritten search query"),
    minYear: z.number().int().optional().describe("only movies released in or after this year"),
    maxYear: z.number().int().optional().describe("only movies released in or before this year"),
    topK: z.number().int().min(1).max(20).default(5),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        title: z.string(),
        year: z.number(),
        director: z.string(),
        description: z.string(),
        score: z.number(),
      }),
    ),
  }),
  execute: async ({ query, minYear, maxYear, topK }) => {
    const size = topK ?? 5;
    const { embeddings } = await embeddingModel.doEmbed({ values: [query] });

    const yearFilter =
      minYear !== undefined || maxYear !== undefined
        ? {
            range: {
              "metadata.year": {
                ...(minYear !== undefined ? { gte: minYear } : {}),
                ...(maxYear !== undefined ? { lte: maxYear } : {}),
              },
            },
          }
        : undefined;

    const res = await es.search<MovieSource>({
      index: INDEX,
      size,
      _source: ["metadata.title", "metadata.year", "metadata.director", "metadata.description"],
      retriever: {
        rrf: {
          retrievers: [
            {
              standard: {
                query: yearFilter
                  ? { bool: { must: { match: { "metadata.description": query } }, filter: yearFilter } }
                  : { match: { "metadata.description": query } },
              },
            },
            {
              knn: {
                field: "embedding",
                query_vector: embeddings[0]!,
                k: Math.max(size, 50),
                num_candidates: 100,
                ...(yearFilter ? { filter: yearFilter } : {}),
              },
            },
          ],
          rank_constant: 60,
          rank_window_size: 100,
        },
      },
    });

    const results = res.hits.hits.flatMap((h) => {
      const m = h._source?.metadata;
      if (!m) return [];
      return [{ title: m.title, year: m.year, director: m.director, description: m.description, score: h._score ?? 0 }];
    });

    return { results };
  },
});
