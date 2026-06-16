import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import type { BaselineData, TestResult } from "./types.js";

const BASELINES_DIR = join(process.env.HOME ?? "", ".pulser", "baselines");

export function skillHash(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 6);
}

export function loadBaseline(skillName: string, hash: string): BaselineData | null {
  const filePath = join(BASELINES_DIR, `${skillName}-${hash}.json`);
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as BaselineData;
  } catch {
    return null;
  }
}

export function saveBaseline(skillName: string, hash: string, results: TestResult[]): void {
  try {
    mkdirSync(BASELINES_DIR, { recursive: true });
    const data: BaselineData = {
      timestamp: new Date().toISOString(),
      skill: skillName,
      hash,
      results: results.map((r) => ({ name: r.name, passed: r.passed, duration: r.duration })),
    };
    writeFileSync(join(BASELINES_DIR, `${skillName}-${hash}.json`), JSON.stringify(data, null, 2));
  } catch {
    // Baseline save failure is non-fatal — eval result is still reported
  }
}

export function detectRegressions(baseline: BaselineData, current: TestResult[]): Set<string> {
  const regressions = new Set<string>();
  for (const b of baseline.results) {
    if (b.passed) {
      const cur = current.find((r) => r.name === b.name);
      if (cur && !cur.passed) {
        regressions.add(b.name);
      }
    }
  }
  return regressions;
}
