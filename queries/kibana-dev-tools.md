# Elasticsearch queries (Kibana → Dev Tools)

Hybrid (RRF) and reranking run at the Elasticsearch query layer, not through the
Mastra store. These queries run against the `scifi-movies` index created by the
native store, where fields are nested under `metadata` (`metadata.description`,
`metadata.year`) and the vector field is `embedding`.

RRF and rerankers require an appropriate license; they are included on Elastic
Cloud (including serverless). The `knn` legs embed the query text server-side via
`query_vector_builder` + a deployed `.openai-text-embedding-3-small` inference
endpoint, so no client-side vectors are needed. If that endpoint is unavailable,
pass a precomputed `query_vector` instead.

## Keyword (BM25)

```json
POST scifi-movies/_search
{
  "size": 5,
  "_source": ["metadata.title"],
  "query": { "match": { "metadata.description": "UFO alien" } }
}
```

Matches only documents that contain those terms. A document whose description
omits the words (e.g. one that describes alien contact without saying "UFO" or
"alien") will not appear.

## Vector (kNN)

```json
POST scifi-movies/_search
{
  "size": 5,
  "_source": ["metadata.title", "metadata.year"],
  "knn": {
    "field": "embedding",
    "k": 5,
    "num_candidates": 100,
    "query_vector_builder": {
      "text_embedding": {
        "model_id": ".openai-text-embedding-3-small",
        "model_text": "a scientist detects a radio signal from intelligent life in space"
      }
    }
  }
}
```

Ranks by meaning, so semantically relevant documents surface even with no term
overlap.

## Hybrid (BM25 + kNN) fused with RRF

```json
POST scifi-movies/_search
{
  "size": 6,
  "_source": ["metadata.title", "metadata.year"],
  "retriever": {
    "rrf": {
      "retrievers": [
        { "standard": { "query": { "match": { "metadata.description": "first contact UFO alien" } } } },
        { "knn": {
            "field": "embedding",
            "k": 80,
            "num_candidates": 200,
            "query_vector_builder": {
              "text_embedding": {
                "model_id": ".openai-text-embedding-3-small",
                "model_text": "first contact with UFOs"
              }
            } } }
      ],
      "rank_constant": 60,
      "rank_window_size": 100
    }
  }
}
```

`rrf` fuses the two legs by rank: `score(d) = Σ 1 / (rank_constant + rankᵢ)`. No
score calibration between legs is required.

## RRF + cross-encoder reranker

```json
POST scifi-movies/_search
{
  "size": 5,
  "_source": ["metadata.title", "metadata.year"],
  "retriever": {
    "text_similarity_reranker": {
      "retriever": {
        "rrf": {
          "retrievers": [
            { "standard": { "query": { "match": { "metadata.description": "first contact UFO alien" } } } },
            { "knn": {
                "field": "embedding", "k": 80, "num_candidates": 200,
                "query_vector_builder": {
                  "text_embedding": { "model_id": ".openai-text-embedding-3-small",
                                      "model_text": "first contact with UFOs" } } } }
          ],
          "rank_window_size": 100
        }
      },
      "field": "metadata.description",
      "inference_id": ".jina-reranker-v3",
      "inference_text": "first contact with UFOs",
      "rank_window_size": 100
    }
  }
}
```

Over-fetch in the hybrid stage, then a cross-encoder reorders the merged pool,
scoring query and document jointly. `.jina-reranker-v3` is hosted and responds
immediately; a model that scales from zero (e.g. `.rerank-v1-elasticsearch`) may
time out on its first call and need a retry. The reranker's `rank_window_size`
must be ≤ the inner RRF's.

## Hybrid + filter (year)

```json
POST scifi-movies/_search
{
  "size": 5,
  "_source": ["metadata.title", "metadata.year"],
  "retriever": {
    "rrf": {
      "retrievers": [
        { "standard": { "query": {
            "bool": { "must": { "match": { "metadata.description": "alien" } },
                      "filter": { "range": { "metadata.year": { "gte": 2010 } } } } } } },
        { "knn": {
            "field": "embedding", "k": 50, "num_candidates": 100,
            "filter": { "range": { "metadata.year": { "gte": 2010 } } },
            "query_vector_builder": {
              "text_embedding": { "model_id": ".openai-text-embedding-3-small",
                                  "model_text": "alien movies" } } } }
      ]
    }
  }
}
```

## Index mapping

```json
GET scifi-movies/_mapping
```

`embedding` is a `dense_vector` (1536, cosine); movie fields are nested under
`metadata`, with `metadata.description` mapped as `text` for BM25.
