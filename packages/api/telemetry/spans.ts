import {
  SpanStatusCode,
  trace,
  type Attributes,
  type Span,
} from "@opentelemetry/api";

const tracer = trace.getTracer("sp-insulina-api");

export function traceSpan<T>(
  name: string,
  attributes: Attributes,
  run: (span: Span) => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      return await run(span);
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}

export function traceDbQuery<T>(
  operation: string,
  collection: string,
  run: () => Promise<T>,
): Promise<T> {
  return traceSpan(
    `${operation} ${collection}`,
    {
      "db.system.name": "postgresql",
      "db.operation.name": operation,
      "db.collection.name": collection,
    },
    run,
  );
}
