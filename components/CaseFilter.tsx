"use client";

/**
 * CaseFilter — the app's one feature-level Client Component.
 *
 * Why this is the client boundary: filtering is interactive (typing,
 * selecting) and reads/writes the URL search params, all of which need
 * the browser. Everything else in the app is a Server Component that
 * renders on the server with data loaded from disk.
 *
 * The filtering logic itself lives in lib/filter.ts as pure functions,
 * so it is unit-tested without rendering React.
 */
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  criteriaFromSearchParams,
  criteriaToSearchParams,
  filterCases,
  getCategories,
  type CaseFilterCriteria,
  type PassStatus,
} from "@/lib/filter";
import type { EvalCase } from "@/lib/types";

export default function CaseFilter({ cases }: { cases: EvalCase[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [criteria, setCriteria] = useState<CaseFilterCriteria>(() =>
    criteriaFromSearchParams(new URLSearchParams(searchParams.toString())),
  );

  const categories = useMemo(() => getCategories(cases), [cases]);
  const filtered = useMemo(() => filterCases(cases, criteria), [cases, criteria]);

  function update(next: CaseFilterCriteria) {
    setCriteria(next);
    const params = criteriaToSearchParams(next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return (
    <>
      <form
        className="filters"
        onSubmit={(e) => e.preventDefault()}
        aria-label="Filter cases"
      >
        <label>
          Result
          <select
            value={criteria.status}
            onChange={(e) =>
              update({ ...criteria, status: e.target.value as PassStatus })
            }
          >
            <option value="all">All</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <label>
          Category
          <select
            value={criteria.category}
            onChange={(e) => update({ ...criteria, category: e.target.value })}
          >
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
        <label>
          Search
          <input
            type="search"
            value={criteria.query}
            placeholder="Search input, expected, actual…"
            onChange={(e) => update({ ...criteria, query: e.target.value })}
          />
        </label>
      </form>

      <p aria-live="polite">
        Showing {filtered.length} of {cases.length} cases
      </p>

      <table>
        <thead>
          <tr>
            <th>Case</th>
            <th>Category</th>
            <th>Input</th>
            <th>Expected</th>
            <th>Actual</th>
            <th>Result</th>
            <th>Latency</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c.id}>
              <td className="mono">{c.id}</td>
              <td>{c.category}</td>
              <td>{c.input}</td>
              <td>{c.expected}</td>
              <td>{c.actual}</td>
              <td>
                <span className={c.passed ? "badge pass" : "badge fail"}>
                  {c.passed ? "pass" : "fail"}
                </span>
              </td>
              <td>{c.latency_ms} ms</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p>No cases match these filters.</p>}
    </>
  );
}
