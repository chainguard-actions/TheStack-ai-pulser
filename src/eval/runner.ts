import { spawnSync } from "child_process";

export interface RunResult {
  output: string;
  duration: number;
  timeout: boolean;
  error?: string;
}

// Check claude CLI is installed and reachable before running any tests.
export function checkClaudeCLI(): boolean {
  const result = spawnSync("claude", ["--version"], {
    encoding: "utf-8",
    timeout: 5_000,
  });
  // ENOENT = binary not found; any other error (SIGTERM, etc.) means it exists
  return (result.error as NodeJS.ErrnoException | undefined)?.code !== "ENOENT";
}

// Run a single skill test via `claude -p`.
// Uses spawnSync with an args array — never exec/shell — to prevent injection
// from arbitrary skill content or test input strings.
export function runSkillTest(skillContent: string, input: string): RunResult {
  const start = Date.now();

  const result = spawnSync("claude", ["-p", "--system-prompt", skillContent, input], {
    encoding: "utf-8",
    timeout: 30_000,
  });

  const duration = Date.now() - start;
  const err = result.error as NodeJS.ErrnoException | undefined;

  if (err?.code === "ETIMEDOUT" || result.signal === "SIGTERM") {
    return { output: "", duration, timeout: true };
  }

  if (err?.code === "E2BIG") {
    return { output: "", duration, timeout: false, error: "skill content too large for argv" };
  }

  if (err) {
    return { output: "", duration, timeout: false, error: err.message };
  }

  return {
    output: (result.stdout ?? "").trim(),
    duration,
    timeout: false,
  };
}
