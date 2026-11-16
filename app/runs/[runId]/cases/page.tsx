import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import CaseFilter from "@/components/CaseFilter";
import { getAllRunIds, getRunById } from "@/lib/data";

export async function generateStaticParams() {
  const ids = await getAllRunIds();
  return ids.map((runId) => ({ runId }));
}

/**
 * Case explorer page — a Server Component that loads the run on the
 * server and hands the cases to the app's one feature Client Component
 * (CaseFilter). The Suspense boundary is required because CaseFilter
 * reads URL search params via useSearchParams.
 */
export default async function RunCasesPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const run = await getRunById(runId);
  if (!run) notFound();

  return (
    <>
      <p>
        <Link href={`/runs/${run.run_id}`}>← Back to run {run.run_id}</Link>
      </p>
      <section className="panel">
        <h2>Cases — {run.run_id}</h2>
        <p>
          Filter by result, category, or text. Filters live in the URL, so a
          filtered view can be copied and shared.
        </p>
        <Suspense fallback={<p>Loading case explorer…</p>}>
          <CaseFilter cases={run.cases} />
        </Suspense>
      </section>
    </>
  );
}
