import Link from "next/link";

export default function NotFound() {
  return (
    <section className="panel">
      <h2>Not found</h2>
      <p>That run or page does not exist.</p>
      <p>
        <Link href="/">Back to all runs</Link>
      </p>
    </section>
  );
}
