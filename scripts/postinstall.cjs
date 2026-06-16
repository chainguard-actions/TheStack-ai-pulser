#!/usr/bin/env node

const { mkdirSync, writeFileSync, existsSync } = require("fs");
const { join } = require("path");
const { homedir } = require("os");

const SKILL_DIR = join(homedir(), ".claude", "skills", "pulser");
const SKILL_PATH = join(SKILL_DIR, "SKILL.md");

if (existsSync(SKILL_PATH)) {
  console.log("  pulser skill already installed — skipping");
  process.exit(0);
}

const SKILL_CONTENT = `---
name: pulser
description: >-
  Diagnose Claude Code skills against Anthropic's 7 principles.
  Scans SKILL.md files for 8 rules (gotchas, description, allowed-tools,
  file-size, structure, frontmatter, conflicts, usage-hooks), classifies
  skill types, generates prescriptions. Use when checking skill quality,
  auditing skills, or before publishing skills.
  Triggers on "check skills", "audit skills", "skill health", "pulser",
  "스킬 점검", "스킬 진단", "check my skills", "skill quality".
disable-model-invocation: false
allowed-tools: Bash(pulser *), Read, Edit
---

# Pulser — Skill Diagnostics

Diagnose Claude Code skills and present results conversationally.

## How to Run

Run pulser and capture JSON output:
\`\`\`bash
pulser --format json
\`\`\`

For a single skill:
\`\`\`bash
pulser --format json --skill <name>
\`\`\`

## How to Present Results

1. Run pulser --format json and capture output
2. Parse the JSON result
3. Present a conversational summary:
   - Total skills, score, healthy/warning/error counts
   - Top 5 issues with skill name + problem
   - Ask "Fix these?"
4. If user agrees, read each SKILL.md and apply fixes using Edit tool
   - You understand the skill better than templates — write context-aware fixes
   - Add meaningful Gotchas based on what the skill actually does
   - Set appropriate allowed-tools based on the skill's purpose

## Summary Format Example

Skill Diagnosis Complete:

Score: 76/100 | 30 skills scanned
22 healthy | 6 warnings | 2 errors

Top issues:
1. cardnews — No Gotchas section, no allowed-tools
2. geo-audit — 338 lines single file, no Gotchas
3. detailpage — No Gotchas, no allowed-tools

Want me to fix these?

## Gotchas

1. Never dump raw JSON to user — always summarize conversationally
2. For fixes, use Edit tool directly — you have better context than CLI --fix
3. Group fixes by priority, confirm with user before applying
4. Score below 50 = urgent, highlight clearly
5. If pulser CLI is not installed, tell user to run: npm install -g pulser-cli
`;

try {
  mkdirSync(SKILL_DIR, { recursive: true });
  writeFileSync(SKILL_PATH, SKILL_CONTENT);
  console.log("");
  console.log("  ✓ pulser skill installed to ~/.claude/skills/pulser/");
  console.log("  Claude Code now responds to: \"check my skills\", \"스킬 점검해줘\", \"/pulser\"");
  console.log("");
} catch {
  // Silent fail — skill install is optional enhancement
}
