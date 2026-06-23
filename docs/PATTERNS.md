# Patterns → code

| # | Pattern | Where |
|---|---------|-------|
| 1 | Hybrid RRF (BM25 + vector, fused at query time) | [`hybrid-search-tool.ts`](../src/mastra/tools/hybrid-search-tool.ts) · [`kibana-dev-tools.md`](../queries/kibana-dev-tools.md) |
| 2 | Cross-encoder reranking | [`kibana-dev-tools.md`](../queries/kibana-dev-tools.md) |
| 3 | Agentic retrieval (the model decides to search and rewrites the query) | [`elasticsearch-agent.ts`](../src/mastra/agents/elasticsearch-agent.ts) |
| 4 | Metadata filtering (year) | `minYear`/`maxYear` on the search tool |
| 5 | Memory across turns | `Memory` on the agent |

The agent's search tool fuses BM25 and vector retrieval with RRF over
Elasticsearch's `retriever` API (patterns 1, 3, 4), with memory across turns
(pattern 5). Cross-encoder reranking (pattern 2) is shown as a query-layer
example.
