import type { Rule, Diagnostic, ParsedSkill, SkillClassification } from "../types.js";

export const fileSizeRule: Rule = {
  name: "file-size",
  tier: "core",
  run(skill: ParsedSkill, _classification: SkillClassification): Diagnostic[] {
    if (skill.lineCount > 500) {
      return [{
        rule: "file-size",
        tier: "core",
        severity: "error",
        message: `SKILL.md is ${skill.lineCount} lines (limit: 500)`,
        detail: "Anthropic recommends keeping SKILL.md under 500 lines. Move detailed reference material to supporting files.",
      }];
    }

    if (skill.lineCount > 400) {
      return [{
        rule: "file-size",
        tier: "core",
        severity: "warning",
        message: `SKILL.md is ${skill.lineCount} lines (approaching 500 limit)`,
        detail: "Consider splitting reference material into separate files before hitting the limit.",
      }];
    }

    return [];
  },
};
