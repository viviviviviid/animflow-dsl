"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { compileAnimFlow } from "@animflow-dsl/compiler";
import type { Diagnostic, RenderPlan } from "@animflow-dsl/model";
import { AnimFlowCanvas, PlaybackControls } from "@animflow-dsl/react-v2";
import {
  createPlayback,
  type PlaybackController,
  type PlaybackSnapshot,
} from "@animflow-dsl/runtime";

export interface V2PlayerProps {
  readonly source: string;
  readonly onDiagnostics: (diagnostics: readonly Diagnostic[]) => void;
}

export function V2Player({ source, onDiagnostics }: V2PlayerProps) {
  const [plan, setPlan] = useState<RenderPlan | null>(null);
  const [playback, setPlayback] = useState<PlaybackSnapshot | null>(null);
  const [compiling, setCompiling] = useState(true);
  const controllerRef = useRef<PlaybackController | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCompiling(true);
    const timer = window.setTimeout(async () => {
      const result = await compileAnimFlow(source);
      if (cancelled) return;
      setCompiling(false);
      onDiagnostics(result.diagnostics);
      if (!result.ok) {
        controllerRef.current = null;
        setPlan(null);
        setPlayback(null);
        return;
      }
      const controller = createPlayback(result.value);
      controllerRef.current = controller;
      setPlan(result.value);
      setPlayback(controller.snapshot());
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [source, onDiagnostics]);

  useEffect(() => {
    if (playback?.status !== "playing") return;
    let request = 0;
    let previous = performance.now();
    const advance = (now: number) => {
      const controller = controllerRef.current;
      if (!controller) return;
      const next = controller.tick(now - previous);
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
    <div className="flex h-full min-h-0 flex-col bg-[#0b0f16]">
      <div className="relative min-h-0 flex-1 overflow-hidden p-4">
        <div className="h-full overflow-hidden rounded-2xl border border-slate-700/70 bg-white shadow-[0_22px_70px_rgba(0,0,0,0.35)]">
          <AnimFlowCanvas ariaLabel="Compiled AnimFlow v2 diagram" frame={playback.frame} plan={plan} />
        </div>
        <div className="pointer-events-none absolute left-7 top-7 rounded-md border border-slate-600/70 bg-[#101722]/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-300">
          {playback.frame.sceneId ?? "initial"} · {Math.round(playback.frame.progress * 100)}%
        </div>
        {playback.frame.narration ? (
          <div className="pointer-events-none absolute bottom-7 left-1/2 w-[min(680px,calc(100%-4rem))] -translate-x-1/2 rounded-xl border border-slate-600/70 bg-[#101722]/95 px-5 py-3 text-center text-sm leading-6 text-slate-100 shadow-xl">
            {playback.frame.narration.text}
          </div>
        ) : null}
      </div>
      <div className="border-t border-slate-800 bg-[#0d121a] p-3">
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
        />
      </div>
    </div>
  );
}

function Status({ message, error = false }: { readonly message: string; readonly error?: boolean }) {
  return (
    <div className="grid h-full place-items-center bg-[#0b0f16] p-8">
      <div className={`max-w-md rounded-xl border px-5 py-4 font-mono text-sm ${error ? "border-red-400/40 bg-red-950/30 text-red-200" : "border-blue-400/30 bg-blue-950/20 text-blue-100"}`}>
        {message}
      </div>
    </div>
  );
}
