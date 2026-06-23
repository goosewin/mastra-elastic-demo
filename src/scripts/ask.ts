import "dotenv/config";
import { mastra } from "../mastra/index.js";

type Movie = { title?: string; year?: number };
interface GenResult {
  text: string;
  toolCalls?: Array<{ payload?: { args?: { query?: string } } }>;
  toolResults?: Array<{ payload?: { result?: { results?: Movie[] } } }>;
}

const question =
  process.argv.slice(2).join(" ").trim() || "Find 5 movies about first contact with UFOs.";

const agent = mastra.getAgent("elasticsearchAgent");
const res = (await agent.generate(question)) as unknown as GenResult;

const query = res.toolCalls?.[0]?.payload?.args?.query;
if (query) console.log(`query: ${query}`);

const hits = res.toolResults?.[0]?.payload?.result?.results;
if (hits?.length) {
  for (const h of hits) if (h.title) console.log(`  ${h.title} (${h.year ?? "?"})`);
}

console.log(`\n${res.text}\n`);
