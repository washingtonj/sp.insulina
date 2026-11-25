import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";

import type { TelemetryConfig } from "./config.ts";

export type Telemetry = {
  shutdown(): Promise<void>;
};

/**
 * Tracing starts only when an OTLP endpoint is configured. The SDK itself
 * reads the remaining OTEL_* variables: headers, sampler and batch limits.
 */
export function startTelemetry(config: TelemetryConfig): Telemetry | null {
  if (!config.enabled) return null;

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      "service.name": config.serviceName,
      "service.version": config.serviceVersion,
      "deployment.environment": config.environment,
    }),
    traceExporter: new OTLPTraceExporter(),
    metricReaders: [],
    instrumentations: [],
  });

  sdk.start();

  return { shutdown: () => sdk.shutdown() };
}
