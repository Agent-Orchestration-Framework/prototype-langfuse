import { PromptTemplate } from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { CallbackHandler } from "langfuse-langchain";
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
).withConfig({
  runName: "Request Router Prompt",
});

const uiClassification = z.object({
  requestType: z.enum(["COMPONENT", "LAYOUT"]),
});

const requestRouter = requestRouterPrompt
  .pipe(
    model.withStructuredOutput(uiClassification).withConfig({
      runName: "Send to LLM",
    })
  )
  .withConfig({
    runName: "Request Router",
  });

const runnable = RunnableSequence.from([
  RunnablePassthrough.assign({ request: requestRouter }).withConfig({
    runName: "Request Router Passthrough",
  }),
  (args) => {
    if (args.request.requestType === "COMPONENT") {
      console.log("A component was requested.");
    } else {
      console.log("A layout was requsted");
      return layoutChain;
    }

    return args;
  },
]).withConfig({
  runName: "UI request chain",
});

const langfuseHandler = new CallbackHandler();

const response = await runnable.invoke(
  {
    input,
  },
  {
    callbacks: [langfuseHandler],
  }
);

console.log(response);
