"use client";

// Next.js requires error boundaries to be Client Components — this is a
// framework-required client boundary, not an interactive feature component.
// The only feature-level Client Component in this app is components/CaseFilter.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="panel">
      <h2>Something went wrong</h2>
      <p>{error.message || "An unexpected error occurred while loading this page."}</p>
      <button type="button" onClick={() => reset()}>
        Try again
      </button>
    </section>
  );
}
