import { ModelRouterEmbeddingModel } from "@mastra/core/llm";

export const EMBED_MODEL_ID = "openai/text-embedding-3-small";
export const EMBED_DIMS = 1536;

export const embeddingModel = new ModelRouterEmbeddingModel(EMBED_MODEL_ID);

export async function embedMany(values: string[]): Promise<number[][]> {
  const { embeddings } = await embeddingModel.doEmbed({ values });
  return embeddings;
}
