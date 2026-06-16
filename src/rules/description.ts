import type { Rule, Diagnostic, ParsedSkill, SkillClassification } from "../types.js";

const TRIGGER_PATTERNS = [
  /use when/i,
  /triggers? on/i,
  /use for/i,
  /invoke when/i,
  /activate when/i,
];

export const descriptionRule: Rule = {
  name: "description",
  tier: "core",
  run(skill: ParsedSkill, _classification: SkillClassification): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const desc = skill.frontmatter.description || "";

    if (!desc) return [];

    if (desc.length < 100) {
      diagnostics.push({
        rule: "description",
        tier: "core",
        severity: "warning",
        message: `Description too short (${desc.length} chars, recommend 100-500)`,
        detail: "Short descriptions give Claude insufficient context to decide when to use your skill.",
      });
    }

    if (desc.length > 500) {
      diagnostics.push({
        rule: "description",
        tier: "core",
        severity: "info",
        message: `Description is long (${desc.length} chars). Consider trimming to under 500.`,
        detail: "Skill descriptions consume context budget. Keep them focused on trigger conditions.",
      });
    }

    const hasTriggerPattern = TRIGGER_PATTERNS.some((p) => p.test(desc));
    if (!hasTriggerPattern) {
      diagnostics.push({
        rule: "description",
        tier: "core",
        severity: "warning",
        message: "No trigger pattern found (e.g., \"Use when...\", \"Triggers on...\")",
        detail: "Descriptions should tell Claude WHEN to use this skill. Add phrases like 'Use when...' or 'Triggers on...'",
      });
    }

    return diagnostics;
  },
};
