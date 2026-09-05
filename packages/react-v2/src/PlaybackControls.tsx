import type { CSSProperties, ReactElement } from "react";

export interface PlaybackControlsProps {
  readonly status: "idle" | "playing" | "paused" | "ended";
  readonly timeMs: number;
  readonly durationMs: number;
  readonly speed: number;
  readonly loop: boolean;
  readonly onPlay: () => void;
  readonly onPause: () => void;
  readonly onRestart: () => void;
  readonly onSeek: (timeMs: number) => void;
  readonly onSpeedChange: (speed: number) => void;
  readonly onLoopChange: (loop: boolean) => void;
  /** Disables transport mutations while retaining timeline seek. */
  readonly transportDisabled?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
}

const transportStyle: CSSProperties = {
  alignItems: "center",
  background: "var(--animflow-controls-surface, #10141d)",
  border: "1px solid var(--animflow-controls-border, #2b3342)",
  borderRadius: 12,
  color: "var(--animflow-controls-text, #e8edf5)",
  display: "grid",
  fontFamily: "var(--font-display, sans-serif)",
  fontSize: 13,
  gap: 10,
  gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
  padding: "10px 12px",
};

const buttonStyle: CSSProperties = {
  alignItems: "center",
  background: "var(--animflow-controls-button, #202838)",
  border: "1px solid var(--animflow-controls-border, #374156)",
  borderRadius: 8,
  color: "inherit",
  cursor: "pointer",
  display: "inline-flex",
  font: "inherit",
  justifyContent: "center",
  minHeight: 36,
  padding: "0 10px",
};

export function PlaybackControls(props: PlaybackControlsProps): ReactElement {
  const playing = props.status === "playing";
  return (
    <div aria-label="Animation playback" className={props.className} role="group" style={{ ...transportStyle, ...props.style }}>
      <div style={{ display: "flex", gap: 6 }}>
        <button aria-label="Restart animation" disabled={props.transportDisabled} onClick={props.onRestart} style={buttonStyle} type="button">↺</button>
        <button aria-label={playing ? "Pause animation" : "Play animation"} disabled={props.transportDisabled} onClick={playing ? props.onPause : props.onPlay} style={{ ...buttonStyle, background: "var(--animflow-controls-accent, #215fd1)", color: "#fff", borderColor: "transparent", minWidth: 66 }} type="button">
          {playing ? "Pause" : "Play"}
        </button>
      </div>
      <label style={{ alignItems: "center", display: "grid", gap: 8, gridTemplateColumns: "auto 1fr auto" }}>
        <span className="animflow-time-label">Time</span>
        <input aria-label="Animation time" aria-valuetext={`${formatTime(props.timeMs)} of ${formatTime(props.durationMs)}`} max={props.durationMs} min={0} onChange={(event) => props.onSeek(Number(event.currentTarget.value))} step={1} style={{ accentColor: "var(--animflow-controls-accent, #4a8cff)", width: "100%", minWidth: 0 }} type="range" value={Math.min(props.timeMs, props.durationMs)} />
        <span style={{ color: "var(--animflow-controls-muted, #9eabc0)", fontVariantNumeric: "tabular-nums", minWidth: 88, textAlign: "right", fontSize: 12 }}>{formatTime(props.timeMs)} / {formatTime(props.durationMs)}</span>
      </label>
      <label style={{ alignItems: "center", display: "flex", gap: 6 }}>
        <span className="animflow-speed-label">Speed</span>
        <select aria-label="Playback speed" disabled={props.transportDisabled} onChange={(event) => props.onSpeedChange(Number(event.currentTarget.value))} style={{ ...buttonStyle, minHeight: 34 }} value={props.speed}>
          {[0.5, 1, 1.5, 2].map((speed) => <option key={speed} value={speed}>{speed}×</option>)}
        </select>
      </label>
      <label style={{ alignItems: "center", cursor: "pointer", display: "flex", gap: 6 }}>
        <input checked={props.loop} disabled={props.transportDisabled} onChange={(event) => props.onLoopChange(event.currentTarget.checked)} style={{ accentColor: "#4a8cff" }} type="checkbox" />
        Loop
      </label>
    </div>
  );
}

function formatTime(timeMs: number): string {
  const seconds = Math.max(0, timeMs) / 1000;
  const minutes = Math.floor(seconds / 60);
  const remainder = (seconds % 60).toFixed(1).padStart(4, "0");
  return `${minutes}:${remainder}`;
}
