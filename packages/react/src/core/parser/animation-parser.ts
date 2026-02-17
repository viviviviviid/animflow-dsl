import type { AnimationStep, AnimationAction, AnimationProperties } from "../types";
import { parseIndentedProperties } from "./lexer";

/**
 * Parse @animation section
 */
export function parseAnimation(animationText: string): AnimationStep[] {
  const steps: AnimationStep[] = [];
  const lines = animationText.split("\n");
  
  let currentStep: Partial<AnimationStep> | null = null;
  let propertyLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // New step line: "step 1: show nodeA"
    if (trimmed.startsWith("step ")) {
      // Save previous step
      if (currentStep) {
        const props = parseIndentedProperties(propertyLines.join("\n"));
        currentStep.properties = props as AnimationProperties;
        steps.push(currentStep as AnimationStep);
      }

      // Parse new step: "step N: action target1, target2"
      // The targets string (.+) accepts any characters including hyphens and dots in node IDs
      const match = trimmed.match(/step\s+(\d+):\s+(\w+)\s+(.+)/);
      if (match) {
        const stepNum = parseInt(match[1], 10);
        const action = match[2] as AnimationAction;
        const targetsStr = match[3].trim();

        // Parse targets (can be comma-separated or arrow-separated for connect)
        let targets: string[] = [];
        if (action === "connect") {
          // Parse: nodeA->nodeB or nodeA->nodeB, nodeC->nodeD
          const connections = targetsStr.split(",").map(s => s.trim());
          targets = connections;
        } else {
          targets = targetsStr.split(",").map(s => s.trim());
        }

        currentStep = {
          step: stepNum,
          action,
          targets,
          properties: {},
        };
        propertyLines = [];
      }
    }
    // Property line (indented)
    else if (line.startsWith("  ") && currentStep) {
      propertyLines.push(line);
    }
  }

  // Save last step
  if (currentStep) {
    const props = parseIndentedProperties(propertyLines.join("\n"));
    currentStep.properties = props as AnimationProperties;
    steps.push(currentStep as AnimationStep);
  }

  return steps;
}
