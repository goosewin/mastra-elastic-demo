# Hybrid Retrieval Patterns for AI Agents

A Mastra agent that answers questions about sci-fi movies by retrieving over
Elasticsearch, using Mastra's native Elasticsearch integration
(`@mastra/elasticsearch` + `@mastra/rag`).

- **Agent** — a Mastra agent whose search tool fuses keyword (BM25) and semantic
  (vector) retrieval with RRF at query time, plus metadata filtering and memory.
  The agent rewrites the query, searches, filters, and carries context across turns.
- **Elasticsearch query layer** — the same hybrid plus a cross-encoder reranker as
  raw queries. See [`queries/kibana-dev-tools.md`](queries/kibana-dev-tools.md).

## Requirements

- Node.js ≥ 22.13 (`.nvmrc` pins 22 — `nvm use`)
- An Elasticsearch cluster (Elastic Cloud, or local via `start-local`)
- An OpenAI API key

## Setup

```bash
npm install
cp .env.example .env   # set ELASTICSEARCH_URL, ELASTICSEARCH_API_KEY, OPENAI_API_KEY
npm run setup          # create the scifi-movies index
npm run ingest         # embed and load the movies
```

## Usage

```bash
npm run dev                                   # Mastra Studio at http://localhost:4111
npm run ask "Find 5 movies about UFOs"        # full agent answer
npm run search "first contact with aliens"    # vector retrieval only
```

## Layout

| Path | Role |
|------|------|
| [`src/mastra/agents/elasticsearch-agent.ts`](src/mastra/agents/elasticsearch-agent.ts) | Agent, hybrid search tool, memory |
| [`src/mastra/tools/hybrid-search-tool.ts`](src/mastra/tools/hybrid-search-tool.ts) | Hybrid (BM25 + vector, RRF) search tool |
| [`src/mastra/index.ts`](src/mastra/index.ts) | Mastra instance (entry point for `mastra dev`) |
| [`src/lib/elastic-store.ts`](src/lib/elastic-store.ts) | Elasticsearch client + `ElasticSearchVector` store |
| [`src/lib/embedding.ts`](src/lib/embedding.ts) | Embedding model (ingest + query) |
| [`src/lib/storage.ts`](src/lib/storage.ts) | SQLite storage for memory |
| [`src/data/movies.ts`](src/data/movies.ts) | Seed dataset |
| [`src/scripts/`](src/scripts) | `setup-index`, `ingest`, `search`, `ask` |
| [`queries/kibana-dev-tools.md`](queries/kibana-dev-tools.md) | Query-layer examples (hybrid, reranker) |
| [`docs/PATTERNS.md`](docs/PATTERNS.md) | Patterns → code map |

The agent fuses BM25 + vector with RRF over Elasticsearch's `retriever` API; the
`ElasticSearchVector` store handles index creation and ingestion. Cross-encoder
reranking is shown as a query-layer example in `queries/kibana-dev-tools.md`.

## References

- [Build a RAG agent with Mastra and Elasticsearch](https://mastra.ai/blog/build-rag-agent-mastra-elasticsearch)
- [Build agentic AI applications with Mastra & Elasticsearch](https://www.elastic.co/search-labs/blog/build-agentic-ai-applications-mastra-elasticsearch)
- [Elasticsearch hybrid search (RRF / ELSER)](https://www.elastic.co/search-labs/blog/hybrid-search-elasticsearch)
- [createVectorQueryTool() reference](https://mastra.ai/reference/tools/vector-query-tool)
- [elastic/mastra-elasticsearch-example](https://github.com/elastic/mastra-elasticsearch-example)

Built against Mastra 1.x.
