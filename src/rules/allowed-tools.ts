import type { Rule, Diagnostic, ParsedSkill, SkillClassification } from "../types.js";

export const allowedToolsRule: Rule = {
  name: "allowed-tools",
  tier: "recommended",
  run(skill: ParsedSkill, classification: SkillClassification): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const tools = skill.frontmatter["allowed-tools"];

    if (!tools) {
      diagnostics.push({
        rule: "allowed-tools",
        tier: "recommended",
        severity: "warning",
        message: "No `allowed-tools` set — skill has unrestricted tool access",
        detail: "Restricting tools prevents accidental file modifications. Recommended for analysis/research skills.",
      });
      return diagnostics;
    }

    const { primary, confidence } = classification;
    if (confidence < 0.5) return diagnostics;

    if ((primary === "analysis" || primary === "research") && tools.includes("Bash")) {
      diagnostics.push({
        rule: "allowed-tools",
        tier: "recommended",
        severity: "warning",
        message: `Bash in allowed-tools for ${primary} skill (unnecessary write access)`,
        detail: `${primary} skills typically only need read access. Consider removing Bash.`,
      });
    }

    if (primary === "analysis" && (tools.includes("Write") || tools.includes("Edit"))) {
      diagnostics.push({
        rule: "allowed-tools",
        tier: "recommended",
        severity: "warning",
        message: "Write/Edit in allowed-tools for analysis skill",
        detail: "Analysis skills should be read-only. Remove Write and Edit access.",
      });
    }

    return diagnostics;
  },
};
