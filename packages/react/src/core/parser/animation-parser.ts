import type { AnimationStep, AnimationAction, AnimationProperties } from "../types";
import { parseIndentedProperties } from "./lexer";

const ANIMATION_ACTIONS = new Set<AnimationAction>([
  "show",
  "hide",
  "highlight",
  "unhighlight",
  "connect",
  "move",
  "transform",
  "camera",
  "annotate",
]);

function finishStep(
  steps: AnimationStep[],
  currentStep: Partial<AnimationStep> | null,
  propertyLines: string[]
): void {
  if (!currentStep) return;
  const parsed = parseIndentedProperties(propertyLines.join("\n"));
  currentStep.properties = {
    ...(currentStep.properties ?? {}),
    ...parsed,
  } as AnimationProperties;
  steps.push(currentStep as AnimationStep);
}

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
        finishStep(steps, currentStep, propertyLines);
      }

      // Parse new step: "step N: action target1, target2"
      // The targets string (.+) accepts any characters including hyphens and dots in node IDs
      const match = trimmed.match(/step\s+(\d+):\s+(\w+)\s+(.+)/);
      if (match) {
        const stepNum = parseInt(match[1], 10);
        const action = match[2] as AnimationAction;
        let targetsStr = match[3].trim();

        if (!ANIMATION_ACTIONS.has(action)) {
          throw new Error(`Unknown animation action \"${match[2]}\" in step ${stepNum}`);
        }

        const baseProperties: AnimationProperties = {};
        if (action === "camera") {
          const cameraMatch = targetsStr.match(/^(focus|fitAll|fitNodes|zoom|pan)(?:\s+(.+))?$/);
          if (cameraMatch) {
            baseProperties.cameraAction = cameraMatch[1] as AnimationProperties["cameraAction"];
            targetsStr = cameraMatch[2]?.trim() ?? "";
          }
        }

        // Parse targets (can be comma-separated or arrow-separated for connect)
        let targets: string[] = [];
        if (action === "connect") {
          // Parse: nodeA->nodeB or nodeA->nodeB, nodeC->nodeD
          const connections = targetsStr.split(",").map(s => s.trim());
          targets = connections.filter(Boolean);
        } else {
          targets = targetsStr.split(",").map(s => s.trim()).filter(Boolean);
        }

        currentStep = {
          step: stepNum,
          action,
          targets,
          properties: baseProperties,
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
    finishStep(steps, currentStep, propertyLines);
  }

  return steps;
}
