import { Client } from "@elastic/elasticsearch";
import { ElasticSearchVector } from "@mastra/elasticsearch";

export const INDEX = process.env.ELASTICSEARCH_INDEX_NAME ?? "scifi-movies";

const node = process.env.ELASTICSEARCH_URL ?? "http://localhost:9200";
const apiKey = process.env.ELASTICSEARCH_API_KEY;
const auth = apiKey ? { auth: { apiKey } } : {};

export const es = new Client({ node, ...auth });

export const esVector = new ElasticSearchVector({ id: "elasticsearch", url: node, ...auth });
