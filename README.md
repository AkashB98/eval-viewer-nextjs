# Eval Viewer (Next.js)

A small Next.js front end for viewing AI-agent evaluation results — run
summaries, kit-level checks, and per-case pass/fail detail with a shareable,
filterable case explorer.

> **Honest framing:** this is my first hands-on React/Next.js project. I built
> it with AI assistance (Builder/Fetch) as a learning and portfolio project,
> and I am reviewing and walking through the code to learn it. My background
> is Python/data tooling — the eval kits this viewer displays are mine; the
> React/Next.js layer is new, and this repo is how I am learning it in the
> open rather than claiming experience I do not have.

## POC framing

- **Problem:** my Python eval kits (e.g. `agent-eval-dashboard`) produce JSON
  reports that are painful to read raw. Reviewing a run meant opening a JSON
  file and eyeballing pass rates and failing cases.
- **Success criteria (declared up front):** (1) an overview page listing all
  runs with pass rate, latency, and cost; (2) a per-run page with the kit
  checks and per-category pass rates; (3) a case explorer filterable by
  result, category, and text, with filters shareable via the URL; (4) any
  malformed run file rejected by a runtime type guard instead of crashing a
  render; (5) `npm run build` and `npm test` green.
- **Result:** all five criteria met. Four fictional sample runs ship in
  `data/runs/`; the type guard, aggregation, and filtering logic are covered
  by Vitest unit tests in `lib/__tests__/`.

## What it shows

| Route | What it does |
|---|---|
| `/` | Overview: aggregate stats + a table of all runs with plain-CSS pass-rate bars |
| `/runs/[runId]` | Run detail: summary, pass rate by category, and the checks table |
| `/runs/[runId]/cases` | Case explorer: filter by pass/fail, category, and text search |

## Data shape

Types in `lib/types.ts` are modelled on the real output of my Python kit
`agent-eval-dashboard`, whose `evals/eval_report.json` is
`{ all_passed: boolean, checks: [{ name, pass, detail }] }`. A run report
extends that shape:

```ts
{
  run_id: string,
  kit: string,
  started_at: string,            // ISO timestamp
  suite: string,
  summary: { total_cases, passed, pass_rate, mean_latency_ms, total_cost_usd },
  checks: [{ name, pass, detail }],          // same shape as the Python kit
  cases: [{ id, category, input, expected, actual, passed, latency_ms }],
}
```

All sample data in `data/runs/*.json` is fictional — invented kits, models,
and cases. No personal or real evaluation data is included.

## Server vs. client components — and why the filter is the boundary

Next.js App Router components are **Server Components by default**: they run
only on the server, can read the filesystem directly, and ship no JavaScript
to the browser for their rendering. Every page in this app is a server
component:

- `app/page.tsx`, `app/runs/[runId]/page.tsx`, and
  `app/runs/[runId]/cases/page.tsx` load run JSON through `lib/data.ts`,
  which uses Node `fs`. That only works on the server — and it means the
  data-loading code never reaches the browser bundle.

**One feature needs the browser:** the case filter. Typing in a search box,
changing a dropdown, and keeping the URL in sync (`useSearchParams` /
`router.replace`) are interactive, browser-only concerns. So exactly one
feature component opts into the client with `"use client"`:
`components/CaseFilter.tsx`. The server page loads the run and hands the
cases down to it as props; the filtering math itself stays in pure,
unit-tested functions in `lib/filter.ts`.

Two honest footnotes: `app/error.tsx` also carries `"use client"` because
Next.js *requires* error boundaries to be client components — it is a
framework-required boundary, not a feature. And the cases page wraps
`CaseFilter` in `<Suspense>`, which Next.js requires when a client component
reads search params in a statically generated page.

## Runtime type guard

TypeScript types disappear at runtime, and JSON on disk can be anything.
`lib/guard.ts` validates unknown JSON against the run-report shape
(`isRunReport` / `parseRunReport` / `validateRunReport`). `lib/data.ts`
parses every file through it and skips malformed files with a warning
instead of crashing a render. The guard is unit-tested with malformed
fixtures (missing fields, wrong types, out-of-range rates, `NaN`, negative
latencies).

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # Vitest unit tests (lib/ only)
npm run build   # production build — must pass
```

## Project layout

```
app/                      App Router pages (all Server Components)
  page.tsx                overview
  runs/[runId]/page.tsx   run detail (generateStaticParams)
  runs/[runId]/cases/     case explorer page
  not-found.tsx, error.tsx
components/
  CaseFilter.tsx          the one feature Client Component
lib/
  types.ts                run-report types (modelled on the Python kit)
  guard.ts                runtime type guard for unknown JSON
  data.ts                 server-side loading via fs
  aggregate.ts            summary / aggregation math
  filter.ts               pure filtering + URL-param (de)serialisation
  __tests__/              Vitest tests for guard, aggregate, filter
data/runs/                4 fictional eval runs (sample data only)
```

## Limitations (honest list)

- **Read-only and file-based.** Runs are JSON files read at build/render
  time. There is no database, no upload path, and no API routes — adding a
  run means adding a file.
- **No live data.** Nothing here runs an evaluation; it only displays
  results produced elsewhere (in the real workflow, by the Python kits).
- **Deliberately plain styling.** Hand-written CSS, no Tailwind or UI kit,
  no chart library (pass-rate bars are styled `div`s), no dark mode.
- **Tests cover `lib/` only.** The pure logic (guard, aggregation,
  filtering) is unit-tested; components and pages are verified by the
  production build, not by rendering tests or e2e.
- **Small scale.** Four sample runs, tens of cases. No pagination or
  virtualisation — unnecessary at this size, necessary at real scale.

## Deliberately out of scope

Auth, a database, API routes/route handlers, charting libraries, Tailwind/UI
kits, Server Actions, ISR/middleware, dark mode, and Playwright/e2e — cut on
purpose to keep the learning surface focused on App Router fundamentals,
the server/client boundary, and typed data handling.

## License

MIT — see [LICENSE](LICENSE).
