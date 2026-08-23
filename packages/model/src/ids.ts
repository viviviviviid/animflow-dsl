declare const brand: unique symbol;

export type Brand<Value, Name extends string> = Value & {
  readonly [brand]: Name;
};

export type DocumentId = Brand<string, "DocumentId">;
export type GraphId = Brand<string, "GraphId">;
export type StoryId = Brand<string, "StoryId">;
export type SceneId = Brand<string, "SceneId">;
export type NodeId = Brand<string, "NodeId">;
export type EdgeId = Brand<string, "EdgeId">;
export type OverlayId = Brand<string, "OverlayId">;
export type ThemeToken = Brand<string, "ThemeToken">;
export type SourceHash = Brand<string, "SourceHash">;
export type ElementHandle = Brand<number, "ElementHandle">;

export type ElementId = NodeId | EdgeId | OverlayId;

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const TOKEN = /^[A-Za-z_][A-Za-z0-9_.-]*$/;
const SOURCE_HASH = /^[a-f0-9]{64}$/;

function createIdentifier<Value extends string>(
  kind: string,
  value: string
): Value {
  if (!IDENTIFIER.test(value)) {
    throw new TypeError(
      `${kind} must match ${IDENTIFIER.source}; received ${JSON.stringify(value)}`
    );
  }
  return value as Value;
}

export const documentId = (value: string): DocumentId =>
  createIdentifier<DocumentId>("DocumentId", value);
export const graphId = (value: string): GraphId =>
  createIdentifier<GraphId>("GraphId", value);
export const storyId = (value: string): StoryId =>
  createIdentifier<StoryId>("StoryId", value);
export const sceneId = (value: string): SceneId =>
  createIdentifier<SceneId>("SceneId", value);
export const nodeId = (value: string): NodeId =>
  createIdentifier<NodeId>("NodeId", value);
export const edgeId = (value: string): EdgeId =>
  createIdentifier<EdgeId>("EdgeId", value);
export const overlayId = (value: string): OverlayId =>
  createIdentifier<OverlayId>("OverlayId", value);

export function themeToken(value: string): ThemeToken {
  if (!TOKEN.test(value)) {
    throw new TypeError(
      `ThemeToken must match ${TOKEN.source}; received ${JSON.stringify(value)}`
    );
  }
  return value as ThemeToken;
}

export function sourceHash(value: string): SourceHash {
  if (!SOURCE_HASH.test(value)) {
    throw new TypeError("SourceHash must be a lowercase 64-character SHA-256 hex string");
  }
  return value as SourceHash;
}

export function elementHandle(value: number): ElementHandle {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`ElementHandle must be a non-negative safe integer; received ${value}`);
  }
  return value as ElementHandle;
}

export function isIdentifier(value: string): boolean {
  return IDENTIFIER.test(value);
}
