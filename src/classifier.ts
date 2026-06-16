import type { ParsedSkill, SkillClassification, SkillType } from "./types.js";

interface Signal {
  type: SkillType;
  weight: number;
  reason: string;
}

export function classifySkill(skill: ParsedSkill): SkillClassification {
  const signals: Signal[] = [];
  const fm = skill.frontmatter;
  const tools = fm["allowed-tools"] || "";

  // High-weight signals
  if (fm.context === "fork") {
    if (tools.includes("WebSearch") || tools.includes("WebFetch")) {
      signals.push({ type: "research", weight: 0.9, reason: "context:fork + web tools" });
    } else {
      signals.push({ type: "analysis", weight: 0.8, reason: "context:fork + read tools" });
    }
  }

  if (fm["disable-model-invocation"] === true) {
    signals.push({ type: "execution", weight: 0.8, reason: "disable-model-invocation:true" });
  }

  if (fm["user-invocable"] === false) {
    signals.push({ type: "reference", weight: 0.8, reason: "user-invocable:false" });
  }

  // Medium-weight signals
  if (tools.includes("WebSearch") || tools.includes("WebFetch")) {
    signals.push({ type: "research", weight: 0.6, reason: "WebSearch/WebFetch in allowed-tools" });
  }

  if (tools.includes("Bash")) {
    signals.push({ type: "execution", weight: 0.5, reason: "Bash in allowed-tools" });
  }

  if (tools && !tools.includes("Bash") && !tools.includes("Write") && !tools.includes("Edit")) {
    signals.push({ type: "analysis", weight: 0.5, reason: "read-only tools" });
  }

  // Low-weight signals from content
  const content = skill.content.toLowerCase();
  if (content.includes("generate") || content.includes("create") || content.includes("produce")) {
    signals.push({ type: "generation", weight: 0.3, reason: "generation keywords in content" });
  }

  if (content.includes("analyze") || content.includes("review") || content.includes("inspect")) {
    signals.push({ type: "analysis", weight: 0.3, reason: "analysis keywords in content" });
  }

  if (signals.length === 0) {
    return {
      primary: "generation",
      confidence: 0.3,
      signals: ["no clear signals — defaulting to generation"],
    };
  }

  const scores = new Map<SkillType, number>();
  const reasons = new Map<SkillType, string[]>();

  for (const s of signals) {
    scores.set(s.type, (scores.get(s.type) || 0) + s.weight);
    const r = reasons.get(s.type) || [];
    r.push(s.reason);
    reasons.set(s.type, r);
  }

  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const [primaryType, primaryScore] = sorted[0];
  const totalWeight = [...scores.values()].reduce((a, b) => a + b, 0);
  const confidence = Math.min(primaryScore / totalWeight, 1.0);

  const mixed = sorted
    .slice(1)
    .filter(([, score]) => score / totalWeight > 0.25)
    .map(([type]) => type);

  return {
    primary: primaryType,
    confidence: Number(confidence.toFixed(2)),
    signals: reasons.get(primaryType) || [],
    ...(mixed.length > 0 ? { mixed } : {}),
  };
}
