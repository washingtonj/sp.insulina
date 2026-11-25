import { trace } from "@opentelemetry/api";

type Level = "info" | "warn" | "error";

export function log(
  level: Level,
  message: string,
  fields: Record<string, unknown> = {},
): void {
  const spanContext = trace.getActiveSpan()?.spanContext();

  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...fields,
    ...(spanContext
      ? { trace_id: spanContext.traceId, span_id: spanContext.spanId }
      : {}),
  };

  const write = level === "error" ? console.error : console.log;
  write(JSON.stringify(entry));
}

export function logError(
  message: string,
  error: unknown,
  fields: Record<string, unknown> = {},
): void {
  log("error", message, {
    ...fields,
    error:
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : String(error),
  });
}
