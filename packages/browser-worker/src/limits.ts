export interface BrowserCompileLimits {
  readonly maxSourceBytes: number;
  readonly maxNodes: number;
  readonly maxEdges: number;
  readonly maxScenes: number;
  readonly maxActions: number;
  readonly maxActionNesting: number;
}

export const DEFAULT_BROWSER_COMPILE_LIMITS: BrowserCompileLimits = Object.freeze({
  maxSourceBytes: 256 * 1_024,
  maxNodes: 100,
  maxEdges: 150,
  maxScenes: 30,
  maxActions: 600,
  maxActionNesting: 32,
});
