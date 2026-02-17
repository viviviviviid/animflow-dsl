import type { DiagramConfig } from "../types";
import { parseIndentedProperties } from "./lexer";

/**
 * Parse @config section
 */
export function parseConfig(configText: string): DiagramConfig {
  const props = parseIndentedProperties(configText);
  
  const config: DiagramConfig = {};

  if (props.autoplay !== undefined) config.autoplay = props.autoplay;
  if (props.loop !== undefined) config.loop = props.loop;
  if (props.controls !== undefined) config.controls = props.controls;
  if (props.narration !== undefined) config.narration = props.narration;
  if (props.background) config.background = props.background;

  return config;
}
