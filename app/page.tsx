import Link from "next/link";
import { aggregateRuns, formatPassRate } from "@/lib/aggregate";
import { getAllRuns } from "@/lib/data";

/**
 * Overview page — a Server Component.
 * It reads run JSON from disk via lib/data.ts (Node fs) at render time
 * on the server, so no data fetching code ships to the browser.
 */
export default async function HomePage() {
  const runs = await getAllRuns();
  const stats = aggregateRuns(runs);

  return (
    <>
      <section className="panel">
        <h2>All runs</h2>
        <div className="stats-row">
          <div className="stat">
            <strong>{stats.total_runs}</strong>
            <span>runs</span>
          </div>
          <div className="stat">
            <strong>{stats.total_cases}</strong>
            <span>cases</span>
          </div>
          <div className="stat">
            <strong>{formatPassRate(stats.overall_pass_rate)}</strong>
            <span>overall pass rate</span>
          </div>
          <div className="stat">
            <strong>{stats.mean_latency_ms.toFixed(0)} ms</strong>
            <span>mean latency</span>
          </div>
          <div className="stat">
            <strong>${stats.total_cost_usd.toFixed(4)}</strong>
            <span>total cost</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>Run</th>
              <th>Kit / suite</th>
              <th>Started</th>
              <th>Pass rate</th>
              <th>Cases</th>
              <th>Mean latency</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.run_id}>
                <td>
                  <Link href={`/runs/${run.run_id}`}>{run.run_id}</Link>
                </td>
                <td>
                  {run.kit}
                  <br />
                  <span className="mono">{run.suite}</span>
                </td>
                <td>{new Date(run.started_at).toLocaleString()}</td>
                <td>
                  <div
                    className={run.summary.pass_rate < 0.7 ? "bar low" : "bar"}
                    role="img"
                    aria-label={`Pass rate ${formatPassRate(run.summary.pass_rate)}`}
                  >
                    <span
                      style={{ width: `${run.summary.pass_rate * 100}%` }}
                    />
                  </div>
                  {formatPassRate(run.summary.pass_rate)}
                </td>
                <td>
                  {run.summary.passed}/{run.summary.total_cases}
                </td>
                <td>{run.summary.mean_latency_ms.toFixed(0)} ms</td>
                <td>${run.summary.total_cost_usd.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {runs.length === 0 && <p>No run files found in data/runs/.</p>}
      </section>
    </>
  );
}
