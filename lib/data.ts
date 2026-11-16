import { promises as fs } from "node:fs";
import path from "node:path";
import { parseRunReport } from "./guard";
import type { RunReport } from "./types";

const RUNS_DIR = path.join(process.cwd(), "data", "runs");

/**
 * Server-side data loading.
 *
 * This module uses Node `fs`, so it may only be imported from Server
 * Components / server code — never from the client filter component.
 * Every file is validated with the runtime type guard; malformed files
 * are rejected (skipped with a warning) instead of crashing a render.
 */
export async function getAllRuns(): Promise<RunReport[]> {
  let files: string[];
  try {
    files = await fs.readdir(RUNS_DIR);
  } catch {
    return [];
  }
  const jsonFiles = files.filter((f) => f.endsWith(".json")).sort();
  const runs: RunReport[] = [];
  for (const file of jsonFiles) {
    const raw = await fs.readFile(path.join(RUNS_DIR, file), "utf-8");
    try {
      runs.push(parseRunReport(JSON.parse(raw)));
    } catch (err) {
      console.warn(`[eval-viewer] skipping malformed run file ${file}:`, err);
    }
  }
  return runs.sort((a, b) => b.started_at.localeCompare(a.started_at));
}

export async function getRunById(runId: string): Promise<RunReport | null> {
  const runs = await getAllRuns();
  return runs.find((r) => r.run_id === runId) ?? null;
}

export async function getAllRunIds(): Promise<string[]> {
  const runs = await getAllRuns();
  return runs.map((r) => r.run_id);
}
