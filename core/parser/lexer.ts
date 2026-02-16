import type { DslSections } from "../types";

/**
 * Split DSL text into sections: diagram, @animation, @style, @narration, @config
 */
export function splitDslSections(dsl: string): DslSections {
  const sections: DslSections = {
    diagram: "",
  };

  // Extract @animation section
  const animMatch = dsl.match(/@animation\s+([\s\S]*?)\s*@end/);
  if (animMatch) {
    sections.animation = animMatch[1].trim();
  }

  // Extract @style section
  const styleMatch = dsl.match(/@style\s+([\s\S]*?)\s*@end/);
  if (styleMatch) {
    sections.style = styleMatch[1].trim();
  }

  // Extract @narration section
  const narrationMatch = dsl.match(/@narration\s+([\s\S]*?)\s*@end/);
  if (narrationMatch) {
    sections.narration = narrationMatch[1].trim();
  }

  // Extract @config section
  const configMatch = dsl.match(/@config\s+([\s\S]*?)\s*@end/);
  if (configMatch) {
    sections.config = configMatch[1].trim();
  }

  // Remove all sections from diagram part
  let diagramText = dsl;
  diagramText = diagramText.replace(/@animation\s+[\s\S]*?@end/g, "");
  diagramText = diagramText.replace(/@style\s+[\s\S]*?@end/g, "");
  diagramText = diagramText.replace(/@narration\s+[\s\S]*?@end/g, "");
  diagramText = diagramText.replace(/@config\s+[\s\S]*?@end/g, "");
  sections.diagram = diagramText.trim();

  return sections;
}

/**
 * Parse indented properties (duration, effect, etc.)
 */
export function parseIndentedProperties(text: string): Record<string, any> {
  const props: Record<string, any> = {};
  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes(":")) continue;

    const colonIndex = trimmed.indexOf(":");
    const key = trimmed.substring(0, colonIndex).trim();
    const value = trimmed.substring(colonIndex + 1).trim();

    // Parse boolean
    if (value === "true") {
      props[key] = true;
    } else if (value === "false") {
      props[key] = false;
    }
    // Parse number
    else if (!isNaN(Number(value))) {
      props[key] = Number(value);
    }
    // Parse string
    else {
      props[key] = value.replace(/^["']|["']$/g, "");
    }
  }

  return props;
}
