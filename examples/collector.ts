import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { trace } from '@opentelemetry/api';

async function main() {
  const collectorUrl = process.env.OTLP_COLLECTOR_ENDPOINT || 'http://localhost:4318/v1/traces';
  console.log('Using OTLP Collector URL:', collectorUrl);

  const traceExporter = new OTLPTraceExporter({
    url: collectorUrl,
  });

  const sdk = new NodeSDK({
    traceExporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  // Start the OpenTelemetry SDK before getting a tracer
  await sdk.start();
  console.log('OpenTelemetry SDK started');

  const tracer = trace.getTracer('bun-example-tracer');

  const span = tracer.startSpan('test-span');
  span.setAttribute('example', 'hello from Bun + OpenTelemetry');
  // Simulate some async work
  await new Promise((resolve) => setTimeout(resolve, 200));
  span.end();
  console.log('Span ended');

  // Give exporter time to send spans before shutdown
  await new Promise((resolve) => setTimeout(resolve, 500));

  await sdk.shutdown();
  console.log('OpenTelemetry SDK shut down');

  // Exit cleanly
  process.exit(0);
}

main().catch((e) => {
  console.error('Error in tracing example:', e);
  process.exit(1);
});