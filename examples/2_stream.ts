import { AIMessageChunk, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { console } from "inspector";

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

const messages = [
  new SystemMessage("Tell me a bedtime story no longer then 100 words."),
];

const stream = await model.stream(messages);

const chunks: AIMessageChunk[] = [];

for await (const chunk of stream) {
  chunks.push(chunk);
  console.log(`${chunk.content}|`);
}
