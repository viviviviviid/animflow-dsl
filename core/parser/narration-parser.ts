import type { NarrationItem } from "../types";

/**
 * Parse @narration section
 */
export function parseNarration(narrationText: string): NarrationItem[] {
  const narrations: NarrationItem[] = [];
  const lines = narrationText.split("\n");
  
  let currentNarration: Partial<NarrationItem> | null = null;
  let currentKey: "title" | "text" | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Step line: "step 1:"
    if (trimmed.startsWith("step ") && trimmed.endsWith(":")) {
      // Save previous narration
      if (currentNarration && currentNarration.step !== undefined) {
        narrations.push(currentNarration as NarrationItem);
      }

      const match = trimmed.match(/step\s+(\d+):/);
      if (match) {
        currentNarration = {
          step: parseInt(match[1], 10),
          title: "",
          text: "",
        };
      }
    }
    // Property line: "title: ...", "text: ..."
    else if (line.startsWith("  ") && currentNarration) {
      const colonIndex = trimmed.indexOf(":");
      if (colonIndex === -1) continue;

      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      if (key === "title" || key === "text") {
        currentKey = key;
        currentNarration[key] = value.replace(/^["']|["']$/g, "");
      }
    }
  }

  // Save last narration
  if (currentNarration && currentNarration.step !== undefined) {
    narrations.push(currentNarration as NarrationItem);
  }

  return narrations;
}
