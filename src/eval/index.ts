import { existsSync, readFileSync } from "fs";
import { join } from "path";
import yaml from "js-yaml";
import { scanSkills } from "../scanner.js";
import { checkClaudeCLI, runSkillTest } from "./runner.js";
import { runAssertions } from "./assertions.js";
import { loadBaseline, saveBaseline, detectRegressions, skillHash } from "./baseline.js";
import { reportEval } from "./reporter.js";
import type { EvalSpec, EvalSummary, SkillEvalResult, TestResult, TestCase } from "./types.js";

function expandHome(p: string): string {
  if (p.startsWith("~")) {
    return join(process.env.HOME ?? "", p.slice(1));
  }
  return p;
}

function isEvalSpec(obj: unknown): obj is EvalSpec {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "tests" in obj &&
    Array.isArray((obj as EvalSpec).tests)
  );
}

function isValidTestCase(t: unknown): t is TestCase {
  return (
    typeof t === "object" &&
    t !== null &&
    typeof (t as TestCase).name === "string" &&
    typeof (t as TestCase).input === "string" &&
    Array.isArray((t as TestCase).assert)
  );
}

export async function runEval(skillsPath: string): Promise<number> {
  if (!checkClaudeCLI()) {
    console.error("\n  Error: claude CLI not found in PATH.");
    console.error("  Install Claude Code and ensure it is on your PATH.\n");
    return 1;
  }

  const resolved = expandHome(skillsPath);
  const allSkills = scanSkills(resolved);

  const evalSkills = allSkills.filter((s) =>
    existsSync(join(s.dirPath, "eval.yaml"))
  );

  if (evalSkills.length === 0) {
    console.log("\n  No eval.yaml files found.");
    console.log("  Add eval.yaml to a skill directory to enable testing.\n");
    return 1;
  }

  const summary: EvalSummary = {
    skills: [],
    passed: 0,
    failed: 0,
    regressions: 0,
    totalDuration: 0,
  };

  const globalStart = Date.now();

  for (const skill of evalSkills) {
    const evalPath = join(skill.dirPath, "eval.yaml");

    let spec: EvalSpec;
    try {
      const raw = readFileSync(evalPath, "utf-8");
      const parsed = yaml.load(raw);
      if (!isEvalSpec(parsed)) {
        console.warn(`  Warning: ${skill.dirName}/eval.yaml missing 'tests' array. Skipping.`);
        continue;
      }
      spec = parsed;
    } catch (err) {
      console.warn(`  Warning: failed to parse ${skill.dirName}/eval.yaml: ${(err as Error).message}. Skipping.`);
      continue;
    }

    const validTests = spec.tests.filter((t, i) => {
      if (!isValidTestCase(t)) {
        console.warn(`  Warning: ${skill.dirName}/eval.yaml test[${i}] missing name/input/assert. Skipping.`);
        return false;
      }
      return true;
    });

    if (validTests.length === 0) continue;

    // Read full raw content (with frontmatter) for use as system prompt
    const skillContent = readFileSync(skill.filePath, "utf-8");
    const hash = skillHash(skillContent);
    const baseline = loadBaseline(skill.dirName, hash);

    const testResults: TestResult[] = [];

    for (const test of validTests) {
      let result: TestResult;
      try {
        const run = runSkillTest(skillContent, test.input);

        if (run.timeout) {
          result = { name: test.name, passed: false, duration: run.duration, timeout: true };
        } else if (run.error) {
          result = { name: test.name, passed: false, duration: run.duration, failureReason: `runner error: ${run.error}` };
        } else {
          const { passed, failureReason } = runAssertions(run.output, test.assert);
          result = { name: test.name, passed, duration: run.duration, output: run.output, failureReason };
        }
      } catch (err) {
        result = { name: test.name, passed: false, duration: 0, failureReason: `unexpected error: ${(err as Error).message}` };
      }

      testResults.push(result);
    }

    // Mark regressions against saved baseline
    if (baseline) {
      const regressions = detectRegressions(baseline, testResults);
      for (const r of testResults) {
        if (regressions.has(r.name)) r.regression = true;
      }
    }

    // Only update baseline if no regressions detected
    const hasRegressions = testResults.some((r) => r.regression);
    if (!hasRegressions) {
      saveBaseline(skill.dirName, hash, testResults);
    }

    const skillResult: SkillEvalResult = {
      skillName: skill.dirName,
      skillHash: hash,
      tests: testResults,
    };

    summary.skills.push(skillResult);
    summary.passed += testResults.filter((r) => r.passed).length;
    summary.failed += testResults.filter((r) => !r.passed && !r.regression).length;
    summary.regressions += testResults.filter((r) => r.regression).length;
  }

  summary.totalDuration = Date.now() - globalStart;

  reportEval(summary);

  // Exit codes: 3=regression, 1=failure, 0=all pass
  if (summary.regressions > 0) return 3;
  if (summary.failed > 0) return 1;
  return 0;
}
