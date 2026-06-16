import { readFileSync, existsSync } from "fs";
import type { SystemRule, Diagnostic, ParsedSkill } from "../types.js";

export const usageHooksRule: SystemRule = {
  name: "usage-hooks",
  tier: "experimental",
  run(_skills: ParsedSkill[], settingsPath: string): Diagnostic[] {
    try {
      if (!existsSync(settingsPath)) {
        return [{
          rule: "usage-hooks",
          tier: "experimental",
          severity: "info",
          message: "No settings.json found — skill usage logging not configured",
          detail: "Install a PreToolUse hook to track which skills are used. Run: npx pulser --install-hooks",
        }];
      }

      const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
      const hooks = settings.hooks?.PreToolUse || [];
      const hasSkillHook = Array.isArray(hooks)
        ? hooks.some((h: any) => {
            const cmd = typeof h === "string" ? h : h.command || "";
            return cmd.includes("Skill") || cmd.includes("skill-usage");
          })
        : false;

      if (!hasSkillHook) {
        return [{
          rule: "usage-hooks",
          tier: "experimental",
          severity: "info",
          message: "No skill usage logging hook found in settings.json",
          detail: "Without usage tracking, you can't tell if a skill is unused because of bad description or because it's not needed.",
        }];
      }
    } catch {
      // Settings parse error — skip
    }

    return [];
  },
};
