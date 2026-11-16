/**
 * Types for AI-agent evaluation run reports.
 *
 * Modelled on the real output shape of the Python kit `agent-eval-dashboard`,
 * whose `evals/eval_report.json` is:
 *
 *   { all_passed: boolean, checks: [{ name, pass, detail }] }
 *
 * A run report extends that spirit to a full eval run: the same `checks`
 * shape, plus run metadata, an aggregate summary, and per-case results.
 */

export interface EvalCheck {
  name: string;
  pass: boolean;
  detail: string;
}

/** The original Python kit report shape, kept for reference / interop. */
export interface EvalReport {
  all_passed: boolean;
  checks: EvalCheck[];
}

export interface EvalCase {
  id: string;
  category: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  latency_ms: number;
}

export interface RunSummary {
  total_cases: number;
  passed: number;
  pass_rate: number;
  mean_latency_ms: number;
  total_cost_usd: number;
}

export interface RunReport {
  run_id: string;
  kit: string;
  started_at: string;
  suite: string;
  summary: RunSummary;
  checks: EvalCheck[];
  cases: EvalCase[];
}
