import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { console } from "inspector";

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

const messages = [
  new SystemMessage("Translate the following from English into Italian"),
  new HumanMessage("hi!"),
  //new AIMessage("Ciao!"),
];

const response = await model.invoke(messages);

console.log("Response:", response.content);
console.log();
console.log(response);
