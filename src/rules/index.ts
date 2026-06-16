import type { Rule, SystemRule, RuleTier } from "../types.js";
import { frontmatterRule } from "./frontmatter.js";
import { descriptionRule } from "./description.js";
import { fileSizeRule } from "./file-size.js";
import { gotchasRule } from "./gotchas.js";
import { allowedToolsRule } from "./allowed-tools.js";
import { structureRule } from "./structure.js";
import { conflictsRule } from "./conflicts.js";
import { usageHooksRule } from "./usage-hooks.js";

export const SKILL_RULES: Rule[] = [
  frontmatterRule,
  descriptionRule,
  fileSizeRule,
  gotchasRule,
  allowedToolsRule,
  structureRule,
];

export const SYSTEM_RULES: SystemRule[] = [
  conflictsRule,
  usageHooksRule,
];

export function getActiveRules(includeExperimental: boolean): {
  skillRules: Rule[];
  systemRules: SystemRule[];
} {
  const filterTier = (tier: RuleTier) =>
    tier === "core" || tier === "recommended" || (tier === "experimental" && includeExperimental);

  return {
    skillRules: SKILL_RULES.filter((r) => filterTier(r.tier)),
    systemRules: SYSTEM_RULES.filter((r) => filterTier(r.tier)),
  };
}
