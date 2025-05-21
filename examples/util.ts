import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

const layoutMoleculesPrompt = PromptTemplate.fromTemplate(
  `Create a list of molcule components needed to generate the requested layout
  
  Layout request:
  {input}`
);

const layoutMolecules = z.object({
  molecules: z.array(z.string()),
});

export const layoutChain = layoutMoleculesPrompt.pipe(
  model.withStructuredOutput(layoutMolecules)
);
