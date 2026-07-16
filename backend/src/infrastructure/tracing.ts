import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';

export function initializeTracing(serviceName: string) {
  // Check if tracing is enabled via environment variable
  if (process.env.ENABLE_TRACING !== 'true') {
    return null;
  }

  const sdk = new NodeSDK({
    // @ts-ignore
    resource: new Resource({
      'service.name': serviceName,
    }),
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  console.log(`[Tracing] Initialized OpenTelemetry for ${serviceName}`);
  
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('[Tracing] Terminated'))
      .catch((error) => console.log('[Tracing] Error terminating', error));
  });

  return sdk;
}
