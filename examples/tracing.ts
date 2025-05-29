import { context } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { AsyncHooksContextManager } from '@opentelemetry/context-async-hooks';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

export const TRACER = 'langfuse-langchain-tracer';

const contextManager = new AsyncHooksContextManager();
context.setGlobalContextManager(contextManager.enable());

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTLP_COLLECTOR_ENDPOINT
});

const sdk = new NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'langfuse-langchain-service'
  })
});

export function startTracing() {
  sdk.start();
  console.log('OpenTelemetry SDK started');
}

export async function stopTracing() {
  await sdk.shutdown();
  console.log('OpenTelemetry SDK shut down');
}

process.on('SIGTERM', async () => {
  await sdk.shutdown();
  console.log('OpenTelemetry tracing terminated');
  process.exit(0);
});
