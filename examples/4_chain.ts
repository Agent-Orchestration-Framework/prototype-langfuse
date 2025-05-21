import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { console } from "inspector";

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

const systemTemplate = "Translate the following from English into {language}";

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemTemplate],
  ["user", "{text}"],
]);

const chain = promptTemplate.pipe(model);

const response = await chain.invoke({
  language: "italian",
  text: "hi!",
});

const response2 = await chain.invoke({
  language: "german",
  text: "welcome",
});

console.log("Response:", response.content);
console.log("Response:", response2.content);
