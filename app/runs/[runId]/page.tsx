import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPassRate, passRateByCategory } from "@/lib/aggregate";
import { getAllRunIds, getRunById } from "@/lib/data";

export async function generateStaticParams() {
  const ids = await getAllRunIds();
  return ids.map((runId) => ({ runId }));
}

/**
 * Run detail page — a Server Component.
 * Shows the run summary, per-category pass rates (plain CSS bars),
 * and the kit-level checks in the original {name, pass, detail} shape.
 */
export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const run = await getRunById(runId);
  if (!run) notFound();

  const categories = passRateByCategory(run.cases);
  const allPassed = run.checks.every((c) => c.pass);

  return (
    <>
      <p>
        <Link href="/">← All runs</Link>
      </p>

      <section className="panel">
        <h2>{run.run_id}</h2>
        <p>
          Kit <strong>{run.kit}</strong> · Suite{" "}
          <span className="mono">{run.suite}</span> · Started{" "}
          {new Date(run.started_at).toLocaleString()}
        </p>
        <div className="stats-row">
          <div className="stat">
            <strong>{formatPassRate(run.summary.pass_rate)}</strong>
            <span>pass rate</span>
          </div>
          <div className="stat">
            <strong>
              {run.summary.passed}/{run.summary.total_cases}
            </strong>
            <span>cases passed</span>
          </div>
          <div className="stat">
            <strong>{run.summary.mean_latency_ms.toFixed(0)} ms</strong>
            <span>mean latency</span>
          </div>
          <div className="stat">
            <strong>${run.summary.total_cost_usd.toFixed(4)}</strong>
            <span>total cost</span>
          </div>
          <div className="stat">
            <strong>{allPassed ? "Yes" : "No"}</strong>
            <span>all checks passed</span>
          </div>
        </div>
        <p>
          <Link href={`/runs/${run.run_id}/cases`}>
            Explore the {run.cases.length} cases →
          </Link>
        </p>
      </section>

      <section className="panel">
        <h3>Pass rate by category</h3>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Pass rate</th>
              <th>Passed</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.category}>
                <td>{cat.category}</td>
                <td>
                  <div
                    className={cat.pass_rate < 0.7 ? "bar low" : "bar"}
                    role="img"
                    aria-label={`Pass rate ${formatPassRate(cat.pass_rate)}`}
                  >
                    <span style={{ width: `${cat.pass_rate * 100}%` }} />
                  </div>
                  {formatPassRate(cat.pass_rate)}
                </td>
                <td>
                  {cat.passed}/{cat.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h3>Checks</h3>
        <table>
          <thead>
            <tr>
              <th>Check</th>
              <th>Result</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {run.checks.map((check) => (
              <tr key={check.name}>
                <td className="mono">{check.name}</td>
                <td>
                  <span className={check.pass ? "badge pass" : "badge fail"}>
                    {check.pass ? "pass" : "fail"}
                  </span>
                </td>
                <td>{check.detail || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
