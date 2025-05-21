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

const messages = await promptTemplate.invoke({
  language: "german",
  text: "hi!",
});

const response = await model.invoke(messages);

console.log("Response:", response.content);
