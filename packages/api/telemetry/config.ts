const DEFAULT_SERVICE_NAME = "sp-insulina-api";
const DEFAULT_SERVICE_VERSION = "0.0.0-dev";

export type TelemetryConfig = {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  enabled: boolean;
};

export function telemetryConfigFromEnv(
  env: NodeJS.ProcessEnv,
): TelemetryConfig {
  return {
    serviceName: env.OTEL_SERVICE_NAME ?? DEFAULT_SERVICE_NAME,
    serviceVersion: env.SERVICE_VERSION ?? DEFAULT_SERVICE_VERSION,
    environment: env.DEPLOYMENT_ENVIRONMENT ?? env.NODE_ENV ?? "development",
    enabled: Boolean(
      env.OTEL_EXPORTER_OTLP_ENDPOINT ??
        env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
    ),
  };
}
