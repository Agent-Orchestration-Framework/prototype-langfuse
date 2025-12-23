import { PromptTemplate } from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { context, trace } from '@opentelemetry/api';
import { CallbackHandler } from "langfuse-langchain";
import { z } from "zod";
import { langfuse } from './langfuse.ts';
import { startTracing, stopTracing, TRACER } from './tracing.ts';
import { layoutChain } from "./util";

const [, , input] = process.argv;

async function runSimple() {
  startTracing();
  const tracer = trace.getTracer(TRACER);

  const otelSpan = tracer.startSpan('runSimple', {
    attributes: { input },
  });
  const traceId = otelSpan.spanContext().traceId;

  const langfuseTrace = langfuse.trace({ id: traceId, name: 'runSimpleTrace', input: { input } });
  const rootSpan = await langfuseTrace.span({ name: 'runSimpleSpan', input: { input }});

  const langfuseHandler = new CallbackHandler({ root: rootSpan });;

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

  return await context.with(trace.setSpan(context.active(), otelSpan), async () => {
    try {
      otelSpan.setAttribute('manual attribute', 'does this work');
      const response = await runnable.invoke(
        { input, },
        { callbacks: [langfuseHandler] }
      );

      console.log(response);
      otelSpan.setAttribute('manual attribute', response);
      otelSpan.setAttribute('response', JSON.stringify(response));
      otelSpan.end();

      await new Promise((resolve) => setTimeout(resolve, 500));
      await stopTracing();

      // return response;
    } catch (err) {
      otelSpan.recordException(err as Error);
      otelSpan.setStatus({ code: 2, message: 'LLM call failed'});
      otelSpan.end();
      throw err;
    }
  });
}

(async () => {
  await runSimple();
})();