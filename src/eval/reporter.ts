import chalk from "chalk";
import type { EvalSummary } from "./types.js";

export function reportEval(summary: EvalSummary): void {
  console.log("");
  console.log("  pulser eval v0.4.0");
  console.log("");

  for (const skill of summary.skills) {
    const total = skill.tests.length;
    console.log(`  ${chalk.bold(skill.skillName)} (${total} test${total === 1 ? "" : "s"})`);

    for (const test of skill.tests) {
      const dur = chalk.dim(`${test.duration}ms`);

      if (test.regression) {
        console.log(`    ${chalk.yellow("⚠")} ${test.name}  ${dur}  ${chalk.yellow("[regression: was passing]")}`);
      } else if (test.passed) {
        console.log(`    ${chalk.green("✓")} ${test.name}  ${dur}`);
      } else if (test.timeout) {
        console.log(`    ${chalk.red("✗")} ${test.name}  ${dur}`);
        console.log(`      ${chalk.dim("→ timed out after 30s")}`);
      } else {
        console.log(`    ${chalk.red("✗")} ${test.name}  ${dur}`);
        if (test.failureReason) {
          console.log(`      ${chalk.dim("→")} ${test.failureReason}`);
        }
      }
    }

    console.log("");
  }

  const durationSec = (summary.totalDuration / 1000).toFixed(2);
  const parts: string[] = [];
  if (summary.passed > 0) parts.push(chalk.green(`${summary.passed} passed`));
  if (summary.failed > 0) parts.push(chalk.red(`${summary.failed} failed`));
  if (summary.regressions > 0) parts.push(chalk.yellow(`${summary.regressions} regression${summary.regressions === 1 ? "" : "s"}`));
  parts.push(chalk.dim(`${durationSec}s`));

  console.log(`  ${parts.join(chalk.dim(" · "))}`);
  console.log("");
}
