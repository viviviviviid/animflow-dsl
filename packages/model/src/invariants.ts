import type {
  AnimationTrack,
  CompiledScene,
  ElementFrameState,
  SceneSnapshot,
} from "./animation";
import type { ElementGeometry } from "./geometry";
import type { ElementHandle } from "./ids";
import type { RenderPlan } from "./render-plan";

export interface ModelViolation {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

function isFiniteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function validateSnapshot(
  snapshot: SceneSnapshot,
  expectedKinds: ReadonlyMap<ElementHandle, ElementFrameState["kind"]>,
  path: string,
  violations: ModelViolation[]
): void {
  const seen = new Set<ElementHandle>();

  for (let index = 0; index < snapshot.elements.length; index += 1) {
    const state = snapshot.elements[index];
    const statePath = `${path}.elements[${index}]`;
    if (seen.has(state.handle)) {
      violations.push({
        code: "MODEL_DUPLICATE_SNAPSHOT_HANDLE",
        path: statePath,
        message: `Handle ${state.handle} appears more than once`,
      });
    }
    seen.add(state.handle);

    const expectedKind = expectedKinds.get(state.handle);
    if (expectedKind === undefined) {
      violations.push({
        code: "MODEL_UNKNOWN_SNAPSHOT_HANDLE",
        path: statePath,
        message: `Handle ${state.handle} does not exist in elements`,
      });
    } else if (expectedKind !== state.kind) {
      violations.push({
        code: "MODEL_SNAPSHOT_KIND_MISMATCH",
        path: statePath,
        message: `Handle ${state.handle} is ${expectedKind}, not ${state.kind}`,
      });
    }

    if (!Number.isFinite(state.opacity) || state.opacity < 0 || state.opacity > 1) {
      violations.push({
        code: "MODEL_INVALID_OPACITY",
        path: `${statePath}.opacity`,
        message: "Opacity must be between 0 and 1",
      });
    }

    if (state.kind === "edge") {
      for (const [property, value] of [
        ["drawProgress", state.drawProgress],
        ["flowPhase", state.flowPhase],
      ] as const) {
        if (!Number.isFinite(value) || value < 0 || value > 1) {
          violations.push({
            code: "MODEL_INVALID_EDGE_PROGRESS",
            path: `${statePath}.${property}`,
            message: `${property} must be between 0 and 1`,
          });
        }
      }
    }
  }

  if (seen.size !== expectedKinds.size) {
    violations.push({
      code: "MODEL_INCOMPLETE_SNAPSHOT",
      path,
      message: `Snapshot has ${seen.size} element states; expected ${expectedKinds.size}`,
    });
  }
}

function trackHandle(track: AnimationTrack): ElementHandle | undefined {
  return track.kind === "camera-rect" ? undefined : track.handle;
}

function validateScene(
  scene: CompiledScene,
  index: number,
  expectedStartMs: number,
  expectedKinds: ReadonlyMap<ElementHandle, ElementFrameState["kind"]>,
  violations: ModelViolation[]
): void {
  const path = `scenes[${index}]`;
  if (scene.startMs !== expectedStartMs) {
    violations.push({
      code: "MODEL_NONCONTIGUOUS_SCENE",
      path: `${path}.startMs`,
      message: `Scene starts at ${scene.startMs}; expected ${expectedStartMs}`,
    });
  }
  if (!isFiniteNonNegative(scene.durationMs)) {
    violations.push({
      code: "MODEL_INVALID_SCENE_DURATION",
      path: `${path}.durationMs`,
      message: "Scene duration must be finite and non-negative",
    });
  }

  validateSnapshot(scene.from, expectedKinds, `${path}.from`, violations);
  validateSnapshot(scene.to, expectedKinds, `${path}.to`, violations);

  for (let trackIndex = 0; trackIndex < scene.tracks.length; trackIndex += 1) {
    const track = scene.tracks[trackIndex];
    const trackPath = `${path}.tracks[${trackIndex}]`;
    if (!isFiniteNonNegative(track.startMs) || !isFiniteNonNegative(track.durationMs)) {
      violations.push({
        code: "MODEL_INVALID_TRACK_TIME",
        path: trackPath,
        message: "Track start and duration must be finite and non-negative",
      });
    } else if (track.startMs + track.durationMs > scene.durationMs) {
      violations.push({
        code: "MODEL_TRACK_OUTSIDE_SCENE",
        path: trackPath,
        message: "Track ends after its scene",
      });
    }

    const handle = trackHandle(track);
    if (handle !== undefined && !expectedKinds.has(handle)) {
      violations.push({
        code: "MODEL_UNKNOWN_TRACK_HANDLE",
        path: `${trackPath}.handle`,
        message: `Track targets unknown handle ${handle}`,
      });
    }
  }
}

function validateGeometry(
  geometry: readonly ElementGeometry[],
  expectedKinds: ReadonlyMap<ElementHandle, ElementFrameState["kind"]>,
  violations: ModelViolation[]
): void {
  const seen = new Set<ElementHandle>();
  for (let index = 0; index < geometry.length; index += 1) {
    const item = geometry[index];
    const path = `geometry[${index}]`;
    if (seen.has(item.handle)) {
      violations.push({
        code: "MODEL_DUPLICATE_GEOMETRY_HANDLE",
        path,
        message: `Geometry handle ${item.handle} appears more than once`,
      });
    }
    seen.add(item.handle);
    const expectedKind = expectedKinds.get(item.handle);
    if (expectedKind !== item.kind) {
      violations.push({
        code: "MODEL_GEOMETRY_KIND_MISMATCH",
        path,
        message: `Geometry for handle ${item.handle} is ${item.kind}; expected ${expectedKind ?? "missing"}`,
      });
    }
  }
  if (seen.size !== expectedKinds.size) {
    violations.push({
      code: "MODEL_INCOMPLETE_GEOMETRY",
      path: "geometry",
      message: `Geometry has ${seen.size} entries; expected ${expectedKinds.size}`,
    });
  }
}

export function validateRenderPlan(plan: RenderPlan): readonly ModelViolation[] {
  const violations: ModelViolation[] = [];
  const expectedKinds = new Map<ElementHandle, ElementFrameState["kind"]>();
  const ids = new Set<string>();

  if (plan.version !== 2) {
    violations.push({
      code: "MODEL_UNSUPPORTED_VERSION",
      path: "version",
      message: `Expected render-plan version 2; received ${plan.version}`,
    });
  }
  if (!Number.isSafeInteger(plan.seed) || plan.seed < 0) {
    violations.push({
      code: "MODEL_INVALID_SEED",
      path: "seed",
      message: "Seed must be a non-negative safe integer",
    });
  }
  if (!isFiniteNonNegative(plan.durationMs)) {
    violations.push({
      code: "MODEL_INVALID_DURATION",
      path: "durationMs",
      message: "Duration must be finite and non-negative",
    });
  }

  for (let index = 0; index < plan.elements.length; index += 1) {
    const element = plan.elements[index];
    const path = `elements[${index}]`;
    if (expectedKinds.has(element.handle)) {
      violations.push({
        code: "MODEL_DUPLICATE_ELEMENT_HANDLE",
        path: `${path}.handle`,
        message: `Handle ${element.handle} appears more than once`,
      });
    }
    expectedKinds.set(element.handle, element.kind);
    if (ids.has(element.id)) {
      violations.push({
        code: "MODEL_DUPLICATE_ELEMENT_ID",
        path: `${path}.id`,
        message: `ID ${element.id} appears more than once`,
      });
    }
    ids.add(element.id);
    if (element.handle !== index) {
      violations.push({
        code: "MODEL_NON_DENSE_HANDLE",
        path: `${path}.handle`,
        message: `Expected dense handle ${index}; received ${element.handle}`,
      });
    }
  }

  if (plan.symbols.length !== plan.elements.length) {
    violations.push({
      code: "MODEL_SYMBOL_COUNT_MISMATCH",
      path: "symbols",
      message: "Symbol count must equal element count",
    });
  }

  validateGeometry(plan.geometry, expectedKinds, violations);
  validateSnapshot(plan.initial, expectedKinds, "initial", violations);

  let expectedStartMs = 0;
  const sceneIds = new Set<string>();
  for (let index = 0; index < plan.scenes.length; index += 1) {
    const scene = plan.scenes[index];
    if (sceneIds.has(scene.id)) {
      violations.push({
        code: "MODEL_DUPLICATE_SCENE_ID",
        path: `scenes[${index}].id`,
        message: `Scene ID ${scene.id} appears more than once`,
      });
    }
    sceneIds.add(scene.id);
    validateScene(scene, index, expectedStartMs, expectedKinds, violations);
    expectedStartMs += scene.durationMs;
  }

  if (expectedStartMs !== plan.durationMs) {
    violations.push({
      code: "MODEL_DURATION_MISMATCH",
      path: "durationMs",
      message: `Scene durations total ${expectedStartMs}; plan duration is ${plan.durationMs}`,
    });
  }

  return violations;
}

export function assertValidRenderPlan(plan: RenderPlan): void {
  const violations = validateRenderPlan(plan);
  if (violations.length > 0) {
    const details = violations
      .map((violation) => `${violation.code} at ${violation.path}: ${violation.message}`)
      .join("\n");
    throw new TypeError(`Invalid RenderPlan:\n${details}`);
  }
}
