"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StudioIcon } from "@/components/studio/StudioIcon";
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
  type AnimFlowNodePositionCommit,
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
  readonly onNodePositionCommit?: (position: AnimFlowNodePositionCommit) => void;
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
  onNodePositionCommit,
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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef<{ pointerId: number; clientX: number; clientY: number; x: number; y: number; scale: number } | undefined>(undefined);
  const controllerRef = useRef<PlaybackController | null>(null);
  const currentSceneIdRef = useRef<string | null>(null);
  const planRef = useRef<RenderPlan | null>(null);
  const playbackTimeRef = useRef<number | null>(null);

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
      const previousPlayback = controllerRef.current?.snapshot();
      const controller = createPlayback(result.plan, { speed: previousPlayback?.speed, loop: previousPlayback?.loop });
      const currentScene = result.plan.scenes.find(
        (scene) => scene.id === currentSceneIdRef.current,
      );
      const firstScene = result.plan.scenes[0];
      const resumeTime = playbackTimeRef.current;
      const previewTime = resumeTime !== null
        ? Math.min(result.plan.durationMs, resumeTime)
        : firstScene
          ? firstScene.startMs + Math.max(0, firstScene.durationMs - 1)
          : 0;
      controllerRef.current = controller;
      planRef.current = result.plan;
      setPlan(result.plan);
      setPlayback(currentScene && resumeTime === null
        ? controller.seek(currentScene.startMs + Math.max(0, currentScene.durationMs - 1))
        : controller.seek(previewTime));
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
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [onSceneChange, playback?.frame.sceneId]);

  useEffect(() => {
    playbackTimeRef.current = playback?.timeMs ?? null;
  }, [playback?.timeMs]);

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

  const view = playback.frame.camera.viewBox;
  const previewFrame = zoom === 1 && pan.x === 0 && pan.y === 0 ? playback.frame : {
    ...playback.frame,
    camera: { ...playback.frame.camera, viewBox: { x: view.x + pan.x + (view.width - view.width / zoom) / 2, y: view.y + pan.y + (view.height - view.height / zoom) / 2, width: view.width / zoom, height: view.height / zoom } },
  };

  return (
    <div className="v2-player">
      <div className="v2-canvas-stage"
        onPointerDown={(event) => {
          if (event.button !== 0 || !(event.target instanceof Element) || event.target.closest('button, [data-animflow-handle]')) return;
          const svg = event.currentTarget.querySelector(".v2-canvas-surface svg") as SVGSVGElement | null;
          const matrix = svg?.getScreenCTM();
          if (!matrix) return;
          panRef.current = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, x: pan.x, y: pan.y, scale: matrix.a };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const start = panRef.current;
          if (!start || start.pointerId !== event.pointerId) return;
          setPan({ x: start.x - (event.clientX - start.clientX) / start.scale, y: start.y - (event.clientY - start.clientY) / start.scale });
        }}
        onPointerUp={(event) => {
          const start = panRef.current;
          if (start && Math.hypot(event.clientX - start.clientX, event.clientY - start.clientY) < 3) onSelectionClear?.();
          panRef.current = undefined;
        }}
        onPointerCancel={() => { panRef.current = undefined; }}
      >
        <div className="v2-canvas-surface">
          <AnimFlowCanvas
            ariaLabel="AnimFlow lecture canvas"
            frame={previewFrame}
            onElementSelect={stale ? undefined : onElementSelect}
            onSelectionClear={stale ? undefined : onSelectionClear}
            onNodePositionCommit={stale ? undefined : onNodePositionCommit}
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
        <div className="v2-viewport-tools" role="group" aria-label="Canvas view">
          <button aria-label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))} type="button"><StudioIcon name="minus" width={16} height={16} /></button>
          <span aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button aria-label="Zoom in" disabled={zoom >= 3} onClick={() => setZoom((value) => Math.min(3, value + 0.25))} type="button"><StudioIcon name="plus" width={16} height={16} /></button>
          <button aria-label="Fit canvas" title="Reset zoom and pan. Drag the background to pan." onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} type="button"><StudioIcon name="fit" width={16} height={16} /><span>Fit</span></button>
        </div>
      </div>
      {playback.frame.narration ? <div className="v2-narration"><span>Narration</span><p>{playback.frame.narration.text}</p></div> : null}
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
