import { describe, expect, it } from "vitest";

import { HealthService } from "./health.service";

describe("HealthService", () => {
  it("returns ok status", () => {
    const service = new HealthService();
    const result = service.getStatus();

    expect(result.status).toBe("ok");
    expect(typeof result.uptime).toBe("number");
    expect(new Date(result.timestamp).toString()).not.toBe("Invalid Date");
  });
});

