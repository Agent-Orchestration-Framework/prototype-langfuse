import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

const taggingPrompt = ChatPromptTemplate.fromTemplate(
  `Extract the desired information from the following passage.

Only extract the properties mentioned in the 'Classification' function.

Passage:
{input}
`
);

const classificationSchema = z.object({
  sentiment: z.string().describe("The sentiment of the text"),
  aggressiveness: z
    .number()
    .int()
    .describe("How aggressive the text is on a scale from 1 to 10"),
  language: z.string().describe("The language the text is written in"),
});

const chain = taggingPrompt.pipe(
  model.withStructuredOutput(classificationSchema)
);

const response = await chain.invoke({
  input:
    "Estoy increiblemente contento de haberte conocido! Creo que seremos muy buenos amigos!",
});

console.log("Response:", response);
