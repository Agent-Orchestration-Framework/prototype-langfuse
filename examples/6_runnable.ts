import { PromptTemplate } from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { layoutChain } from "./util";

const [, , input] = process.argv;

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

const requestRouterPrompt = PromptTemplate.fromTemplate(
  `Classifify the user interface request into one of the options

   Only use the options mentioned in the 'Classification' function.
   
   User interface request:
   {input}`
);

const uiClassification = z.object({
  requestType: z.enum(["COMPONENT", "LAYOUT"]),
});

const requestRouter = requestRouterPrompt.pipe(
  model.withStructuredOutput(uiClassification)
);

const runnable = RunnableSequence.from([
  RunnablePassthrough.assign({ request: requestRouter }),
  (args) => {
    if (args.request.requestType === "COMPONENT") {
      console.log("A component was requested.");
    } else {
      console.log("A layout was requsted");
      return layoutChain;
    }

    return args;
  },
]);

const response = await runnable.invoke({
  input,
});

console.log(response);
