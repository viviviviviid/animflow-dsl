"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserCompileClient, type WorkerLike } from "@animflow-dsl/browser-worker";
import type { Diagnostic, RenderPlan } from "@animflow-dsl/model";
import { AnimFlowCanvas, PlaybackControls } from "@animflow-dsl/react-v2";
import { createPlayback, type PlaybackController, type PlaybackSnapshot } from "@animflow-dsl/runtime";

import type { AnimFlowDiagnostic, AnimFlowPlayerProps } from "./types.js";

export function AnimFlowPlayer({
  source,
  story,
  controls = true,
  ariaLabel = "AnimFlow diagram",
  className,
  style,
  workerUrl,
  ssrPlaceholder,
  onDiagnostic,
  onReady,
}: AnimFlowPlayerProps) {
  const [state, setState] = useState<{ readonly status: "loading" } | { readonly status: "error"; readonly diagnostics: readonly AnimFlowDiagnostic[] } | { readonly status: "ready"; readonly plan: RenderPlan; readonly playback: PlaybackSnapshot }>({ status: "loading" });
  const controllerRef = useRef<PlaybackController | undefined>(undefined);
  const diagnosticRef = useRef(onDiagnostic);
  const readyRef = useRef(onReady);
  diagnosticRef.current = onDiagnostic;
  readyRef.current = onReady;
  const workerHref = workerUrl?.toString();

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    const resolvedWorkerUrl = workerHref ? new URL(workerHref, document.baseURI) : new URL("./worker.js", import.meta.url);
    const client = createBrowserCompileClient({
      workerFactory: () => new Worker(resolvedWorkerUrl, { type: "module" }) as unknown as WorkerLike,
    });
    const job = client.compile(source);
    void job.result.then((result) => {
      if (cancelled || result.status === "superseded") return;
      if (result.status === "failure") {
        const diagnostics = result.diagnostics.map(toPublicDiagnostic);
        diagnostics.forEach((diagnostic) => diagnosticRef.current?.(diagnostic));
        setState({ status: "error", diagnostics });
        return;
      }
      if (story && String(result.plan.storyId) !== story) {
        const diagnostic = storyDiagnostic(story, String(result.plan.storyId));
        diagnosticRef.current?.(diagnostic);
        setState({ status: "error", diagnostics: [diagnostic] });
        return;
      }
      result.diagnostics.map(toPublicDiagnostic).forEach((diagnostic) => diagnosticRef.current?.(diagnostic));
      const controller = createPlayback(result.plan);
      controllerRef.current = controller;
      setState({ status: "ready", plan: result.plan, playback: controller.snapshot() });
      readyRef.current?.({ storyId: String(result.plan.storyId), durationMs: result.plan.durationMs, sourceHash: String(result.plan.sourceHash) });
    });
    return () => { cancelled = true; job.cancel(); client.dispose(); };
  }, [source, story, workerHref]);

  useEffect(() => {
    if (state.status !== "ready" || state.playback.status !== "playing") return;
    let request = 0;
    let previous = performance.now();
    const advance = (now: number) => {
      const controller = controllerRef.current;
      if (!controller) return;
      const playback = controller.tick(Math.max(0, now - previous));
      previous = now;
      setState((current) => current.status === "ready" ? { ...current, playback } : current);
      if (playback.status === "playing") request = requestAnimationFrame(advance);
    };
    request = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(request);
  }, [state.status, state.status === "ready" ? state.playback.status : undefined]);

  const update = useCallback((operation: (controller: PlaybackController) => PlaybackSnapshot) => {
    const controller = controllerRef.current;
    if (!controller) return;
    const playback = operation(controller);
    setState((current) => current.status === "ready" ? { ...current, playback } : current);
  }, []);

  if (state.status === "loading") {
    return <div aria-busy="true" className={className} data-animflow-sdk="loading" style={placeholderStyle(style)}>{ssrPlaceholder ?? "Loading AnimFlow…"}</div>;
  }
  if (state.status === "error") {
    const first = state.diagnostics[0];
    return <div className={className} data-animflow-sdk="error" role="alert" style={errorStyle(style)}><strong>{first?.code ?? "AF-SDK"}</strong><span>{first?.message ?? "AnimFlow could not render this source."}</span></div>;
  }
  return (
    <div className={className} data-animflow-sdk="ready" style={rootStyle(style)}>
      <div style={{ flex: 1, minHeight: 0 }}><AnimFlowCanvas ariaLabel={ariaLabel} frame={state.playback.frame} plan={state.plan} style={{ height: "100%", width: "100%" }} /></div>
      {controls ? <PlaybackControls durationMs={state.plan.durationMs} loop={state.playback.loop} onLoopChange={(loop) => update((controller) => controller.setLoop(loop))} onPause={() => update((controller) => controller.pause())} onPlay={() => update((controller) => controller.play())} onRestart={() => update((controller) => controller.restart())} onSeek={(timeMs) => update((controller) => controller.seek(timeMs))} onSpeedChange={(speed) => update((controller) => controller.setSpeed(speed))} speed={state.playback.speed} status={state.playback.status} timeMs={state.playback.timeMs} /> : null}
    </div>
  );
}

function toPublicDiagnostic(diagnostic: Diagnostic): AnimFlowDiagnostic {
  return {
    code: diagnostic.code,
    severity: diagnostic.severity,
    message: diagnostic.message,
    range: diagnostic.range,
    ...(diagnostic.related ? { related: diagnostic.related } : {}),
    ...(diagnostic.fixes ? { fixes: diagnostic.fixes } : {}),
  };
}

function storyDiagnostic(expected: string, received: string): AnimFlowDiagnostic {
  return { code: "AF305", severity: "error", message: `Requested story ${JSON.stringify(expected)} but the source contains ${JSON.stringify(received)}. AnimFlow 0.1 accepts exactly one story.`, range: { start: { offset: 0, line: 0, character: 0 }, end: { offset: 0, line: 0, character: 0 } } };
}

function rootStyle(style: AnimFlowPlayerProps["style"]): React.CSSProperties { return { background: "#f5f7f3", display: "flex", flexDirection: "column", minHeight: 320, overflow: "hidden", ...style }; }
function placeholderStyle(style: AnimFlowPlayerProps["style"]): React.CSSProperties { return { alignItems: "center", background: "#10141d", color: "#cbd5e1", display: "flex", fontFamily: "ui-monospace, monospace", justifyContent: "center", minHeight: 320, ...style }; }
function errorStyle(style: AnimFlowPlayerProps["style"]): React.CSSProperties { return { background: "#2a1319", border: "1px solid #713846", color: "#ffd5d8", display: "grid", fontFamily: "ui-monospace, monospace", gap: 8, minHeight: 120, padding: 16, ...style }; }
