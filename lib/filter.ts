import type { EvalCase } from "./types";

export type PassStatus = "all" | "passed" | "failed";

export interface CaseFilterCriteria {
  status: PassStatus;
  category: string; // "all" or a category name
  query: string;
}

export const DEFAULT_FILTER: CaseFilterCriteria = {
  status: "all",
  category: "all",
  query: "",
};

/** Distinct categories in a case list, sorted alphabetically. */
export function getCategories(cases: EvalCase[]): string[] {
  return [...new Set(cases.map((c) => c.category))].sort((a, b) =>
    a.localeCompare(b),
  );
}

/**
 * Pure filtering logic for the case explorer.
 * Kept in lib/ (not in the client component) so it is unit-testable
 * without rendering React.
 */
export function filterCases(
  cases: EvalCase[],
  criteria: CaseFilterCriteria,
): EvalCase[] {
  const query = criteria.query.trim().toLowerCase();
  return cases.filter((c) => {
    if (criteria.status === "passed" && !c.passed) return false;
    if (criteria.status === "failed" && c.passed) return false;
    if (criteria.category !== "all" && c.category !== criteria.category)
      return false;
    if (query.length > 0) {
      const haystack = `${c.id} ${c.category} ${c.input} ${c.expected} ${c.actual}`
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

/** Read filter criteria from URL search params (shareable filtered views). */
export function criteriaFromSearchParams(
  params: URLSearchParams,
): CaseFilterCriteria {
  const statusRaw = params.get("status");
  const status: PassStatus =
    statusRaw === "passed" || statusRaw === "failed" ? statusRaw : "all";
  return {
    status,
    category: params.get("category") ?? "all",
    query: params.get("q") ?? "",
  };
}

/** Write filter criteria into URL search params, omitting defaults. */
export function criteriaToSearchParams(
  criteria: CaseFilterCriteria,
): URLSearchParams {
  const params = new URLSearchParams();
  if (criteria.status !== "all") params.set("status", criteria.status);
  if (criteria.category !== "all") params.set("category", criteria.category);
  if (criteria.query.trim().length > 0) params.set("q", criteria.query.trim());
  return params;
}
