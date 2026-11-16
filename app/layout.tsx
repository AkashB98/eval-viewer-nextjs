import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eval Viewer",
  description: "View AI-agent evaluation run results: pass rates, checks, and cases.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <h1>
            <Link href="/">Eval Viewer</Link>
          </h1>
          <p>AI-agent evaluation results — runs, checks, and cases.</p>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
