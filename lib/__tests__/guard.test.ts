import { describe, expect, it } from "vitest";
import { isRunReport, parseRunReport, validateRunReport } from "../guard";
import type { RunReport } from "../types";

const validRun: RunReport = {
  run_id: "run-test-001",
  kit: "fictional-kit",
  started_at: "2026-11-01T09:00:00Z",
  suite: "smoke",
  summary: {
    total_cases: 2,
    passed: 1,
    pass_rate: 0.5,
    mean_latency_ms: 120,
    total_cost_usd: 0.012,
  },
  checks: [{ name: "schema_valid", pass: true, detail: "" }],
  cases: [
    {
      id: "c1",
      category: "factuality",
      input: "What is 2+2?",
      expected: "4",
      actual: "4",
      passed: true,
      latency_ms: 100,
    },
    {
      id: "c2",
      category: "factuality",
      input: "Capital of France?",
      expected: "Paris",
      actual: "Lyon",
      passed: false,
      latency_ms: 140,
    },
  ],
};

describe("isRunReport", () => {
  it("accepts a well-formed run report", () => {
    expect(isRunReport(validRun)).toBe(true);
  });

  it("accepts a report with empty checks and cases arrays", () => {
    expect(isRunReport({ ...validRun, checks: [], cases: [] })).toBe(true);
  });

  it("rejects null, arrays, and primitives", () => {
    expect(isRunReport(null)).toBe(false);
    expect(isRunReport([])).toBe(false);
    expect(isRunReport("run")).toBe(false);
    expect(isRunReport(42)).toBe(false);
    expect(isRunReport(undefined)).toBe(false);
  });

  it("rejects a missing run_id", () => {
    const { run_id: _omit, ...rest } = validRun;
    expect(isRunReport(rest)).toBe(false);
  });

  it("rejects an empty run_id", () => {
    expect(isRunReport({ ...validRun, run_id: "" })).toBe(false);
  });

  it("rejects a summary with pass_rate out of range", () => {
    expect(
      isRunReport({
        ...validRun,
        summary: { ...validRun.summary, pass_rate: 1.5 },
      }),
    ).toBe(false);
  });

  it("rejects a summary with a non-integer total_cases", () => {
    expect(
      isRunReport({
        ...validRun,
        summary: { ...validRun.summary, total_cases: 2.5 },
      }),
    ).toBe(false);
  });

  it("rejects a check missing its detail field", () => {
    expect(
      isRunReport({
        ...validRun,
        checks: [{ name: "x", pass: true }],
      }),
    ).toBe(false);
  });

  it("rejects a case with a string latency", () => {
    expect(
      isRunReport({
        ...validRun,
        cases: [{ ...validRun.cases[0], latency_ms: "fast" }],
      }),
    ).toBe(false);
  });

  it("rejects a case with a negative latency", () => {
    expect(
      isRunReport({
        ...validRun,
        cases: [{ ...validRun.cases[0], latency_ms: -5 }],
      }),
    ).toBe(false);
  });

  it("rejects NaN numbers in the summary", () => {
    expect(
      isRunReport({
        ...validRun,
        summary: { ...validRun.summary, mean_latency_ms: NaN },
      }),
    ).toBe(false);
  });
});

describe("parseRunReport / validateRunReport", () => {
  it("parses a valid report and returns it", () => {
    expect(parseRunReport(validRun)).toEqual(validRun);
  });

  it("throws on malformed input with a readable message", () => {
    expect(() => parseRunReport({ kit: 123 })).toThrow(/Invalid run report/);
  });

  it("reports specific errors for a malformed fixture", () => {
    const result = validateRunReport({ run_id: 7, checks: "nope" });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
    expect(result.errors.join(" ")).toMatch(/run_id/);
  });

  it("reports no errors for a valid report", () => {
    expect(validateRunReport(validRun)).toEqual({ ok: true, errors: [] });
  });
});
