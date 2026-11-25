const BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

type Histogram = {
  sum: number;
  count: number;
  buckets: number[];
};

export type Metrics = ReturnType<typeof createMetrics>;

function escapeLabel(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function renderLabels(key: string, extra = ""): string {
  const [method, route, status] = key.split("|");

  return `{method="${escapeLabel(method)}",route="${escapeLabel(route)}",status="${escapeLabel(status)}"${extra}}`;
}

export function createMetrics() {
  const requests = new Map<string, number>();
  const durations = new Map<string, Histogram>();

  return {
    observeRequest(
      method: string,
      route: string,
      status: number,
      seconds: number,
    ): void {
      const key = `${method}|${route}|${status}`;

      requests.set(key, (requests.get(key) ?? 0) + 1);

      const histogram = durations.get(key) ?? {
        sum: 0,
        count: 0,
        buckets: BUCKETS.map(() => 0),
      };
      histogram.sum += seconds;
      histogram.count += 1;
      BUCKETS.forEach((bucket, index) => {
        if (seconds <= bucket) histogram.buckets[index] += 1;
      });
      durations.set(key, histogram);
    },

    render(): string {
      const lines = [
        "# HELP http_requests_total Total HTTP requests.",
        "# TYPE http_requests_total counter",
      ];

      for (const [key, count] of requests) {
        lines.push(`http_requests_total${renderLabels(key)} ${count}`);
      }

      lines.push(
        "# HELP http_request_duration_seconds HTTP request latency.",
        "# TYPE http_request_duration_seconds histogram",
      );

      for (const [key, histogram] of durations) {
        BUCKETS.forEach((bucket, index) => {
          lines.push(
            `http_request_duration_seconds_bucket${renderLabels(key, `,le="${bucket}"`)} ${histogram.buckets[index]}`,
          );
        });
        lines.push(
          `http_request_duration_seconds_bucket${renderLabels(key, ',le="+Inf"')} ${histogram.count}`,
          `http_request_duration_seconds_sum${renderLabels(key)} ${histogram.sum}`,
          `http_request_duration_seconds_count${renderLabels(key)} ${histogram.count}`,
        );
      }

      lines.push(
        "# HELP process_uptime_seconds Seconds since the process started.",
        "# TYPE process_uptime_seconds gauge",
        `process_uptime_seconds ${process.uptime()}`,
      );

      return `${lines.join("\n")}\n`;
    },
  };
}
