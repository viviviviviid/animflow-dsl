"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { freezeRenderPlan, type RenderPlan } from "@animflow-dsl/model";
import { AnimFlowCanvas } from "@animflow-dsl/react-v2";
import { createPlayback, type PlaybackController, type PlaybackSnapshot } from "@animflow-dsl/runtime";

export interface PresenterProps {
  readonly plan: RenderPlan;
  readonly title: string;
  readonly published?: { readonly revisionId: string; readonly expiresAt: string; readonly integrityHash: string };
}

export function Presenter({ plan: inputPlan, title, published }: PresenterProps) {
  const plan = useMemo(() => freezeRenderPlan(inputPlan), [inputPlan]);
  const controllerRef = useRef<PlaybackController>(createPlayback(plan));
  const [playback, setPlayback] = useState<PlaybackSnapshot>(() => controllerRef.current.snapshot());
  const [notesOpen, setNotesOpen] = useState(true);

  useEffect(() => {
    controllerRef.current = createPlayback(plan);
    setPlayback(controllerRef.current.snapshot());
  }, [plan]);

  useEffect(() => {
    if (playback.status !== "playing") return;
    let request = 0;
    let previous = performance.now();
    const advance = (now: number) => {
      const next = controllerRef.current.tick(Math.max(0, now - previous));
      previous = now;
      setPlayback(next);
      if (next.status === "playing") request = requestAnimationFrame(advance);
    };
    request = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(request);
  }, [playback.status]);

  const update = useCallback((operation: (controller: PlaybackController) => PlaybackSnapshot) => {
    setPlayback(operation(controllerRef.current));
  }, []);

  const activeIndex = Math.max(0, plan.scenes.findIndex((scene) => scene.id === playback.frame.sceneId));
  const jump = useCallback((index: number) => {
    const scene = plan.scenes[Math.max(0, Math.min(index, plan.scenes.length - 1))];
    if (scene) update((controller) => controller.seek(scene.startMs));
  }, [plan.scenes, update]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === " " || event.key === "k") {
        event.preventDefault();
        update((controller) => playback.status === "playing" ? controller.pause() : controller.play());
      } else if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault(); jump(activeIndex + 1);
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault(); jump(activeIndex - 1);
      } else if (event.key === "Home") {
        event.preventDefault(); update((controller) => controller.seek(0));
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault(); void (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
      } else if (event.key.toLowerCase() === "n") {
        setNotesOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, jump, playback.status, update]);

  const activeScene = plan.scenes[activeIndex];
  return (
    <main className={notesOpen ? "presenter-shell has-notes" : "presenter-shell"}>
      <header className="presenter-header">
        <div><span className="presenter-mark">AF</span><div><strong>{title}</strong><small>{published ? "immutable public revision" : "local presenter"}</small></div></div>
        <div className="presenter-header-actions">
          <button aria-pressed={notesOpen} onClick={() => setNotesOpen((open) => !open)} type="button">Notes</button>
          <button onClick={() => void (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())} type="button">Full screen</button>
          {!published ? <Link href="/">Back to Studio</Link> : null}
        </div>
      </header>
      <section className="presenter-audience" aria-label="Audience canvas">
        <AnimFlowCanvas ariaLabel={`${title} presentation`} frame={playback.frame} plan={plan} />
        {playback.frame.narration ? <div className="presenter-caption">{playback.frame.narration.text}</div> : null}
      </section>
      {notesOpen ? (
        <aside className="presenter-notes" aria-label="Speaker notes">
          <span>Speaker cue {activeIndex + 1}/{plan.scenes.length}</span>
          <h2>{activeScene?.title ?? "Opening"}</h2>
          <p>{playback.frame.narration?.text ?? "No narration for this cue."}</p>
          <ol>{plan.scenes.map((scene, index) => <li key={scene.id}><button aria-current={index === activeIndex ? "step" : undefined} onClick={() => jump(index)} type="button"><span>{String(index + 1).padStart(2, "0")}</span>{scene.title}</button></li>)}</ol>
          {published ? <div className="presenter-revision"><span>Revision</span><code>{published.revisionId}</code><span>Integrity</span><code>{published.integrityHash.slice(0, 16)}…</code><span>Expires</span><time>{new Date(published.expiresAt).toLocaleDateString()}</time></div> : null}
        </aside>
      ) : null}
      <nav className="presenter-transport" aria-label="Presentation controls">
        <button aria-label="Previous scene" disabled={activeIndex <= 0} onClick={() => jump(activeIndex - 1)} type="button">←</button>
        <button aria-label={playback.status === "playing" ? "Pause" : "Play"} className="presenter-play" onClick={() => update((controller) => playback.status === "playing" ? controller.pause() : controller.play())} type="button">{playback.status === "playing" ? "Ⅱ" : "▶"}</button>
        <button aria-label="Next scene" disabled={activeIndex >= plan.scenes.length - 1} onClick={() => jump(activeIndex + 1)} type="button">→</button>
        <input aria-label="Presentation timeline" max={plan.durationMs} min={0} onChange={(event) => update((controller) => controller.seek(Number(event.target.value)))} type="range" value={playback.timeMs} />
        <span>{formatTime(playback.timeMs)} / {formatTime(plan.durationMs)}</span>
      </nav>
      {published ? <footer className="presenter-public-footer"><Link href="/privacy">Privacy</Link><Link href="/report">Report content</Link></footer> : null}
    </main>
  );
}

function formatTime(timeMs: number): string {
  const seconds = Math.floor(timeMs / 1_000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
