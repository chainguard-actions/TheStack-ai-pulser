import type { Rule, Diagnostic, ParsedSkill, SkillClassification } from "../types.js";

export const structureRule: Rule = {
  name: "structure",
  tier: "recommended",
  run(skill: ParsedSkill, _classification: SkillClassification): Diagnostic[] {
    if (skill.lineCount > 200 && skill.supportingFiles.length === 0) {
      return [{
        rule: "structure",
        tier: "recommended",
        severity: "warning",
        message: `${skill.lineCount} lines in a single file with no supporting files`,
        detail: "Consider splitting reference material into separate files (references/, examples/, scripts/).",
      }];
    }

    return [];
  },
};
