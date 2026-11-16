import { describe, expect, it } from "vitest";
import {
  aggregateRuns,
  computeSummary,
  formatPassRate,
  passRateByCategory,
} from "../aggregate";
import type { EvalCase, RunReport } from "../types";

function makeCase(overrides: Partial<EvalCase>): EvalCase {
  return {
    id: "c1",
    category: "factuality",
    input: "in",
    expected: "exp",
    actual: "act",
    passed: true,
    latency_ms: 100,
    ...overrides,
  };
}

function makeRun(overrides: Partial<RunReport>): RunReport {
  return {
    run_id: "r1",
    kit: "kit",
    started_at: "2026-11-01T00:00:00Z",
    suite: "smoke",
    summary: {
      total_cases: 2,
      passed: 1,
      pass_rate: 0.5,
      mean_latency_ms: 100,
      total_cost_usd: 0.01,
    },
    checks: [{ name: "ok", pass: true, detail: "" }],
    cases: [],
    ...overrides,
  };
}

describe("computeSummary", () => {
  it("computes totals, pass rate, and mean latency", () => {
    const cases = [
      makeCase({ passed: true, latency_ms: 100 }),
      makeCase({ id: "c2", passed: false, latency_ms: 300 }),
      makeCase({ id: "c3", passed: true, latency_ms: 200 }),
    ];
    const s = computeSummary(cases, 0.03);
    expect(s.total_cases).toBe(3);
    expect(s.passed).toBe(2);
    expect(s.pass_rate).toBeCloseTo(2 / 3);
    expect(s.mean_latency_ms).toBe(200);
    expect(s.total_cost_usd).toBe(0.03);
  });

  it("handles an empty case list without dividing by zero", () => {
    const s = computeSummary([]);
    expect(s).toEqual({
      total_cases: 0,
      passed: 0,
      pass_rate: 0,
      mean_latency_ms: 0,
      total_cost_usd: 0,
    });
  });
});

describe("aggregateRuns", () => {
  it("aggregates across runs with case-weighted latency", () => {
    const runs = [
      makeRun({}),
      makeRun({
        run_id: "r2",
        summary: {
          total_cases: 6,
          passed: 6,
          pass_rate: 1,
          mean_latency_ms: 200,
          total_cost_usd: 0.05,
        },
      }),
    ];
    const stats = aggregateRuns(runs);
    expect(stats.total_runs).toBe(2);
    expect(stats.total_cases).toBe(8);
    expect(stats.total_passed).toBe(7);
    expect(stats.overall_pass_rate).toBeCloseTo(7 / 8);
    // (100*2 + 200*6) / 8 = 175
    expect(stats.mean_latency_ms).toBe(175);
    expect(stats.total_cost_usd).toBeCloseTo(0.06);
    expect(stats.all_checks_passed).toBe(true);
  });

  it("flags when any check in any run failed", () => {
    const runs = [
      makeRun({ checks: [{ name: "x", pass: false, detail: "boom" }] }),
    ];
    expect(aggregateRuns(runs).all_checks_passed).toBe(false);
  });

  it("handles zero runs", () => {
    const stats = aggregateRuns([]);
    expect(stats.total_runs).toBe(0);
    expect(stats.overall_pass_rate).toBe(0);
    expect(stats.mean_latency_ms).toBe(0);
  });
});

describe("passRateByCategory", () => {
  it("groups cases by category, sorted by name", () => {
    const cases = [
      makeCase({ category: "safety", passed: true }),
      makeCase({ id: "c2", category: "factuality", passed: true }),
      makeCase({ id: "c3", category: "factuality", passed: false }),
    ];
    const stats = passRateByCategory(cases);
    expect(stats.map((s) => s.category)).toEqual(["factuality", "safety"]);
    expect(stats[0]).toEqual({
      category: "factuality",
      total: 2,
      passed: 1,
      pass_rate: 0.5,
    });
    expect(stats[1].pass_rate).toBe(1);
  });

  it("returns an empty list for no cases", () => {
    expect(passRateByCategory([])).toEqual([]);
  });
});

describe("formatPassRate", () => {
  it("formats rates as one-decimal percentages", () => {
    expect(formatPassRate(1)).toBe("100.0%");
    expect(formatPassRate(0)).toBe("0.0%");
    expect(formatPassRate(0.83333)).toBe("83.3%");
  });
});
