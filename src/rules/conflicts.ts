import type { SystemRule, Diagnostic, ParsedSkill } from "../types.js";

function extractKeywords(description: string): string[] {
  const keywords: string[] = [];
  const quotedMatches = description.match(/[""\u201C\u201D]([^""\u201C\u201D]+)[""\u201C\u201D]/g);
  if (quotedMatches) {
    for (const m of quotedMatches) {
      keywords.push(m.replace(/[""\u201C\u201D]/g, "").trim().toLowerCase());
    }
  }
  return keywords;
}

export const conflictsRule: SystemRule = {
  name: "conflicts",
  tier: "recommended",
  run(skills: ParsedSkill[], _settingsPath: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const keywordMap = new Map<string, string[]>();

    for (const skill of skills) {
      const desc = skill.frontmatter.description || "";
      const keywords = extractKeywords(desc);
      for (const kw of keywords) {
        const existing = keywordMap.get(kw) || [];
        existing.push(skill.dirName);
        keywordMap.set(kw, existing);
      }
    }

    for (const [keyword, skillNames] of keywordMap) {
      if (skillNames.length > 1) {
        diagnostics.push({
          rule: "conflicts",
          tier: "recommended",
          severity: "warning",
          message: `Trigger keyword "${keyword}" shared by: ${skillNames.join(", ")}`,
          detail: "Overlapping trigger keywords cause Claude to invoke the wrong skill. Differentiate descriptions.",
        });
      }
    }

    return diagnostics;
  },
};
