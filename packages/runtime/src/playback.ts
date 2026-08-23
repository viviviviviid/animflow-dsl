import type { FrameState, RenderPlan } from "@animflow-dsl/model";

import { clamp } from "./easing.js";
import { sample } from "./sample.js";

export type PlaybackStatus = "idle" | "playing" | "paused" | "ended";

export interface PlaybackOptions {
  readonly loop?: boolean;
  readonly speed?: number;
  readonly timeMs?: number;
}

export interface PlaybackSnapshot {
  readonly status: PlaybackStatus;
  readonly timeMs: number;
  readonly speed: number;
  readonly loop: boolean;
  readonly frame: FrameState;
}

export class PlaybackController {
  readonly #plan: RenderPlan;
  #status: PlaybackStatus = "idle";
  #timeMs: number;
  #speed: number;
  #loop: boolean;

  constructor(plan: RenderPlan, options: PlaybackOptions = {}) {
    this.#plan = plan;
    this.#timeMs = clampFinite(options.timeMs ?? 0, 0, plan.durationMs);
    this.#speed = validSpeed(options.speed ?? 1);
    this.#loop = options.loop ?? false;
  }

  play(): PlaybackSnapshot {
    if (this.#status === "ended") this.#timeMs = 0;
    this.#status = "playing";
    return this.snapshot();
  }

  pause(): PlaybackSnapshot {
    if (this.#status === "playing") this.#status = "paused";
    return this.snapshot();
  }

  restart(): PlaybackSnapshot {
    this.#timeMs = 0;
    this.#status = "playing";
    return this.snapshot();
  }

  seek(timeMs: number): PlaybackSnapshot {
    this.#timeMs = clampFinite(timeMs, 0, this.#plan.durationMs);
    if (this.#timeMs < this.#plan.durationMs && this.#status === "ended") {
      this.#status = "paused";
    } else if (this.#timeMs === this.#plan.durationMs && !this.#loop) {
      this.#status = "ended";
    }
    return this.snapshot();
  }

  setSpeed(speed: number): PlaybackSnapshot {
    this.#speed = validSpeed(speed);
    return this.snapshot();
  }

  setLoop(loop: boolean): PlaybackSnapshot {
    this.#loop = loop;
    return this.snapshot();
  }

  tick(deltaMs: number): PlaybackSnapshot {
    if (!Number.isFinite(deltaMs) || deltaMs < 0) {
      throw new TypeError(`deltaMs must be a finite non-negative number; received ${deltaMs}`);
    }
    if (this.#status !== "playing" || deltaMs === 0) return this.snapshot();

    const next = this.#timeMs + deltaMs * this.#speed;
    if (this.#loop && this.#plan.durationMs > 0) {
      this.#timeMs = next % this.#plan.durationMs;
    } else if (next >= this.#plan.durationMs) {
      this.#timeMs = this.#plan.durationMs;
      this.#status = "ended";
    } else {
      this.#timeMs = next;
    }
    return this.snapshot();
  }

  snapshot(): PlaybackSnapshot {
    return Object.freeze({
      status: this.#status,
      timeMs: this.#timeMs,
      speed: this.#speed,
      loop: this.#loop,
      frame: sample(this.#plan, this.#timeMs),
    });
  }
}

export function createPlayback(
  plan: RenderPlan,
  options?: PlaybackOptions,
): PlaybackController {
  return new PlaybackController(plan, options);
}

function validSpeed(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(`Playback speed must be a finite positive number; received ${value}`);
  }
  return value;
}

function clampFinite(value: number, minimum: number, maximum: number): number {
  return Number.isFinite(value) ? clamp(value, minimum, maximum) : minimum;
}
