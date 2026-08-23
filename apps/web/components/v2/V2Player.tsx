"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createBrowserCompileClient,
  type BrowserCompileClient,
  type BrowserCompileJob,
} from "@animflow-dsl/browser-worker";
import type { Diagnostic, RenderPlan } from "@animflow-dsl/model";
import {
  AnimFlowCanvas,
  PlaybackControls,
  type AnimFlowElementSelection,
} from "@animflow-dsl/react-v2";
import {
  createPlayback,
  type PlaybackController,
  type PlaybackSnapshot,
} from "@animflow-dsl/runtime";

export interface V2PlayerProps {
  readonly source: string;
  readonly onDiagnostics: (diagnostics: readonly Diagnostic[]) => void;
  readonly onElementSelect?: (selection: AnimFlowElementSelection) => void;
  readonly onSelectionClear?: () => void;
  readonly onPlan?: (plan: RenderPlan) => void;
  readonly onSceneChange?: (sceneId: string | null) => void;
  readonly onStaleChange?: (stale: boolean) => void;
  readonly seekRequest?: { readonly requestId: number; readonly timeMs: number };
  readonly selectedElementIds?: readonly string[];
}

export function V2Player({
  source,
  onDiagnostics,
  onElementSelect,
  onSelectionClear,
  onPlan,
  onSceneChange,
  onStaleChange,
  seekRequest,
  selectedElementIds,
}: V2PlayerProps) {
  const [plan, setPlan] = useState<RenderPlan | null>(null);
  const [playback, setPlayback] = useState<PlaybackSnapshot | null>(null);
  const [compiling, setCompiling] = useState(true);
  const [client, setClient] = useState<BrowserCompileClient | null>(null);
  const [stale, setStale] = useState(false);
  const controllerRef = useRef<PlaybackController | null>(null);
  const currentSceneIdRef = useRef<string | null>(null);
  const planRef = useRef<RenderPlan | null>(null);

  useEffect(() => {
    const next = createBrowserCompileClient();
    setClient(next);
    return () => next.dispose();
  }, []);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    let job: BrowserCompileJob | undefined;
    setCompiling(true);
    const timer = window.setTimeout(async () => {
      job = client.compile(source);
      const result = await job.result;
      if (cancelled) return;
      if (result.status === "superseded") return;
      setCompiling(false);
      onDiagnostics(result.diagnostics);
      if (result.status === "failure") {
        const paused = controllerRef.current?.pause();
        if (paused) setPlayback(paused);
        setStale(planRef.current !== null);
        return;
      }
      const controller = createPlayback(result.plan);
      const currentScene = result.plan.scenes.find(
        (scene) => scene.id === currentSceneIdRef.current,
      );
      controllerRef.current = controller;
      planRef.current = result.plan;
      setPlan(result.plan);
      setPlayback(currentScene ? controller.seek(currentScene.startMs) : controller.snapshot());
      setStale(false);
      onPlan?.(result.plan);
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      job?.cancel();
    };
  }, [client, source, onDiagnostics, onPlan]);

  useEffect(() => {
    onStaleChange?.(stale);
  }, [onStaleChange, stale]);

  useEffect(() => {
    currentSceneIdRef.current = playback?.frame.sceneId ?? null;
    onSceneChange?.(playback?.frame.sceneId ?? null);
  }, [onSceneChange, playback?.frame.sceneId]);

  useEffect(() => {
    if (!seekRequest || !controllerRef.current) return;
    setPlayback(controllerRef.current.seek(seekRequest.timeMs));
  }, [seekRequest]);

  useEffect(() => {
    if (playback?.status !== "playing") return;
    let request = 0;
    let previous = performance.now();
    const advance = (now: number) => {
      const controller = controllerRef.current;
      if (!controller) return;
      const next = controller.tick(Math.max(0, now - previous));
      previous = now;
      setPlayback(next);
      if (next.status === "playing") request = requestAnimationFrame(advance);
    };
    request = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(request);
  }, [playback?.status]);

  const update = useCallback(
    (operation: (controller: PlaybackController) => PlaybackSnapshot) => {
      const controller = controllerRef.current;
      if (controller) setPlayback(operation(controller));
    },
    [],
  );

  if (compiling && !plan) return <Status message="Compiling typed scene plan…" />;
  if (!plan || !playback) {
    return <Status error message="Fix the diagnostics to produce a render plan." />;
  }

  return (
    <div className="v2-player">
      <div className="v2-canvas-stage">
        <div className="v2-canvas-surface">
          <AnimFlowCanvas
            ariaLabel="AnimFlow lecture canvas"
            frame={playback.frame}
            onElementSelect={stale ? undefined : onElementSelect}
            onSelectionClear={stale ? undefined : onSelectionClear}
            plan={plan}
            selectedElementIds={selectedElementIds}
          />
        </div>
        <div className="v2-timecode">
          {playback.frame.sceneId ?? "initial"} · {Math.round(playback.frame.progress * 100)}%
        </div>
        {stale ? (
          <div className="v2-stale-badge">
            Stale preview
          </div>
        ) : null}
        {playback.frame.narration ? (
          <div className="v2-narration">
            {playback.frame.narration.text}
          </div>
        ) : null}
      </div>
      <div className="v2-controls">
        <PlaybackControls
          durationMs={plan.durationMs}
          loop={playback.loop}
          onLoopChange={(loop) => update((controller) => controller.setLoop(loop))}
          onPause={() => update((controller) => controller.pause())}
          onPlay={() => update((controller) => controller.play())}
          onRestart={() => update((controller) => controller.restart())}
          onSeek={(timeMs) => update((controller) => controller.seek(timeMs))}
          onSpeedChange={(speed) => update((controller) => controller.setSpeed(speed))}
          speed={playback.speed}
          status={playback.status}
          timeMs={playback.timeMs}
          transportDisabled={stale}
        />
      </div>
    </div>
  );
}

function Status({ message, error = false }: { readonly message: string; readonly error?: boolean }) {
  return (
    <div className="v2-status">
      <div data-error={error ? "true" : "false"}>
        {message}
      </div>
    </div>
  );
}
