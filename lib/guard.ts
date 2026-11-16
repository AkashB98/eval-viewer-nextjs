import type { EvalCase, EvalCheck, RunReport, RunSummary } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isEvalCheck(value: unknown): value is EvalCheck {
  return (
    isRecord(value) &&
    isString(value.name) &&
    isBoolean(value.pass) &&
    isString(value.detail)
  );
}

export function isEvalCase(value: unknown): value is EvalCase {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.category) &&
    isString(value.input) &&
    isString(value.expected) &&
    isString(value.actual) &&
    isBoolean(value.passed) &&
    isFiniteNumber(value.latency_ms) &&
    value.latency_ms >= 0
  );
}

export function isRunSummary(value: unknown): value is RunSummary {
  return (
    isRecord(value) &&
    isFiniteNumber(value.total_cases) &&
    Number.isInteger(value.total_cases) &&
    value.total_cases >= 0 &&
    isFiniteNumber(value.passed) &&
    Number.isInteger(value.passed) &&
    value.passed >= 0 &&
    isFiniteNumber(value.pass_rate) &&
    value.pass_rate >= 0 &&
    value.pass_rate <= 1 &&
    isFiniteNumber(value.mean_latency_ms) &&
    value.mean_latency_ms >= 0 &&
    isFiniteNumber(value.total_cost_usd) &&
    value.total_cost_usd >= 0
  );
}

/**
 * Runtime type guard: validates unknown JSON against the run-report shape.
 * Returns true only when every required field is present and correctly typed.
 */
export function isRunReport(value: unknown): value is RunReport {
  if (!isRecord(value)) return false;
  if (!isString(value.run_id) || value.run_id.length === 0) return false;
  if (!isString(value.kit) || value.kit.length === 0) return false;
  if (!isString(value.started_at) || value.started_at.length === 0) return false;
  if (!isString(value.suite) || value.suite.length === 0) return false;
  if (!isRunSummary(value.summary)) return false;
  if (!Array.isArray(value.checks) || !value.checks.every(isEvalCheck)) return false;
  if (!Array.isArray(value.cases) || !value.cases.every(isEvalCase)) return false;
  return true;
}

export interface ParseResult {
  ok: boolean;
  errors: string[];
}

/** Collect human-readable validation errors for a candidate run report. */
export function validateRunReport(value: unknown): ParseResult {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["root value is not an object"] };
  }
  if (!isString(value.run_id) || value.run_id.length === 0)
    errors.push("run_id must be a non-empty string");
  if (!isString(value.kit) || value.kit.length === 0)
    errors.push("kit must be a non-empty string");
  if (!isString(value.started_at) || value.started_at.length === 0)
    errors.push("started_at must be a non-empty string");
  if (!isString(value.suite) || value.suite.length === 0)
    errors.push("suite must be a non-empty string");
  if (!isRunSummary(value.summary)) errors.push("summary is missing or malformed");
  if (!Array.isArray(value.checks)) {
    errors.push("checks must be an array");
  } else if (!value.checks.every(isEvalCheck)) {
    errors.push("checks contains a malformed entry (needs {name, pass, detail})");
  }
  if (!Array.isArray(value.cases)) {
    errors.push("cases must be an array");
  } else if (!value.cases.every(isEvalCase)) {
    errors.push("cases contains a malformed entry");
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Parse unknown JSON into a RunReport, throwing on malformed input.
 * Use this at trust boundaries (files on disk, future API payloads).
 */
export function parseRunReport(value: unknown): RunReport {
  const result = validateRunReport(value);
  if (!result.ok || !isRunReport(value)) {
    throw new Error(`Invalid run report: ${result.errors.join("; ")}`);
  }
  return value;
}
