import type { DiagramConfig } from "../types";
import { parseIndentedProperties } from "./lexer";

/**
 * Parse @config section
 */
export function parseConfig(configText: string): DiagramConfig {
  const props = parseIndentedProperties(configText);
  
  const config: DiagramConfig = {};

  // Boolean properties
  if (props.autoplay !== undefined) config.autoplay = props.autoplay;
  if (props.loop !== undefined) config.loop = props.loop;
  if (props.controls !== undefined) config.controls = props.controls;
  if (props.timeline !== undefined) config.timeline = props.timeline;
  if (props.narration !== undefined) config.narration = props.narration;

  // Number properties
  if (props.speed !== undefined) config.speed = props.speed;
  if (props.width !== undefined) config.width = props.width;
  if (props.height !== undefined) config.height = props.height;
  if (props.fps !== undefined) config.fps = props.fps;

  // String properties
  if (props.background) config.background = props.background;
  if (props.padding) config.padding = props.padding;
  if (props.quality) config.quality = props.quality;

  return config;
}
