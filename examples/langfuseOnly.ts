import { PromptTemplate } from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { context, trace } from '@opentelemetry/api';
import { CallbackHandler } from "langfuse-langchain";
import { z } from "zod";
import { langfuse } from './langfuse';
import { layoutChain } from "./util";

const [, , input] = process.argv;

async function runSimple() {
  const tracer = langfuse.trace({ name: 'runSimpleTrace', input: { input } });

  const rootSpan = await tracer.span({ name: 'runSimpleSpan', input: { input }});

  return await context.with(trace.setSpan(context.active(), rootSpan), async () => {
    try {
      const langfuseHandler = new CallbackHandler({ root: rootSpan });

      const model = new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0,
      });

      const requestRouterPrompt = PromptTemplate.fromTemplate(
        `Classify the user interface request into one of the options

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
            console.log("A layout was requested");
            return layoutChain;
          }

          return args;
        },
      ]).withConfig({
        runName: "UI request chain",
      });

      const response = await runnable.invoke(
        { input, },
        { callbacks: [langfuseHandler] }
      );

      console.log(response);
      // rootSpan.setAttribute('manual attribute', response);
      // rootSpan.setAttribute('response', JSON.stringify(response));
      rootSpan.end();

      await new Promise((resolve) => setTimeout(resolve, 500));

      await langfuseHandler.shutdownAsync();

      return response;
    } catch (err) {
      // rootSpan.recordException(err as Error);
      // rootSpan.setStatus({ code: 2, message: 'LLM call failed'});
      rootSpan.end();
      throw err;
    }
  });
}

(async () => {
  await runSimple();
})();