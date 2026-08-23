/** All source coordinates are zero-based and the end position is exclusive. */
export interface SourcePosition {
  readonly offset: number;
  readonly line: number;
  readonly character: number;
}

export interface SourceRange {
  readonly start: SourcePosition;
  readonly end: SourcePosition;
}

export interface Located<T> {
  readonly value: T;
  readonly range: SourceRange;
}

export const ZERO_POSITION: SourcePosition = Object.freeze({
  offset: 0,
  line: 0,
  character: 0,
});

export const ZERO_RANGE: SourceRange = Object.freeze({
  start: ZERO_POSITION,
  end: ZERO_POSITION,
});
