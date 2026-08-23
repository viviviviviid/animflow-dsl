export interface BrowserCompileLimits {
  readonly maxSourceBytes: number;
  readonly maxNodes: number;
  readonly maxEdges: number;
  readonly maxScenes: number;
  readonly maxActions: number;
  readonly maxActionNesting: number;
}

export const DEFAULT_BROWSER_COMPILE_LIMITS: BrowserCompileLimits = Object.freeze({
  maxSourceBytes: 1_048_576,
  maxNodes: 1_000,
  maxEdges: 2_000,
  maxScenes: 200,
  maxActions: 5_000,
  maxActionNesting: 64,
});
