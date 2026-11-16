import type { EvalCase, RunReport, RunSummary } from "./types";

/** Recompute a summary from raw cases. Single source of truth for the math. */
export function computeSummary(
  cases: EvalCase[],
  totalCostUsd = 0,
): RunSummary {
  const total_cases = cases.length;
  const passed = cases.filter((c) => c.passed).length;
  const pass_rate = total_cases === 0 ? 0 : passed / total_cases;
  const mean_latency_ms =
    total_cases === 0
      ? 0
      : cases.reduce((sum, c) => sum + c.latency_ms, 0) / total_cases;
  return {
    total_cases,
    passed,
    pass_rate,
    mean_latency_ms,
    total_cost_usd: totalCostUsd,
  };
}

export interface OverallStats {
  total_runs: number;
  total_cases: number;
  total_passed: number;
  overall_pass_rate: number;
  mean_latency_ms: number;
  total_cost_usd: number;
  all_checks_passed: boolean;
}

/** Aggregate stats across many runs, for the overview page. */
export function aggregateRuns(runs: RunReport[]): OverallStats {
  const total_cases = runs.reduce((s, r) => s + r.summary.total_cases, 0);
  const total_passed = runs.reduce((s, r) => s + r.summary.passed, 0);
  const total_latency_weighted = runs.reduce(
    (s, r) => s + r.summary.mean_latency_ms * r.summary.total_cases,
    0,
  );
  return {
    total_runs: runs.length,
    total_cases,
    total_passed,
    overall_pass_rate: total_cases === 0 ? 0 : total_passed / total_cases,
    mean_latency_ms: total_cases === 0 ? 0 : total_latency_weighted / total_cases,
    total_cost_usd: runs.reduce((s, r) => s + r.summary.total_cost_usd, 0),
    all_checks_passed: runs.every((r) => r.checks.every((c) => c.pass)),
  };
}

export interface CategoryStat {
  category: string;
  total: number;
  passed: number;
  pass_rate: number;
}

/** Per-category pass rates for one case list, sorted by category name. */
export function passRateByCategory(cases: EvalCase[]): CategoryStat[] {
  const byCategory = new Map<string, { total: number; passed: number }>();
  for (const c of cases) {
    const entry = byCategory.get(c.category) ?? { total: 0, passed: 0 };
    entry.total += 1;
    if (c.passed) entry.passed += 1;
    byCategory.set(c.category, entry);
  }
  return [...byCategory.entries()]
    .map(([category, v]) => ({
      category,
      total: v.total,
      passed: v.passed,
      pass_rate: v.total === 0 ? 0 : v.passed / v.total,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

/** Format a 0..1 rate as a percentage string, e.g. 0.8333 -> "83.3%". */
export function formatPassRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}
