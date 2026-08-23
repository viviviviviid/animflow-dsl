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
  readonly className?: string;
  readonly style?: CSSProperties;
}

const transportStyle: CSSProperties = {
  alignItems: "center",
  background: "#10141d",
  border: "1px solid #2b3342",
  borderRadius: 12,
  color: "#e8edf5",
  display: "grid",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 12,
  gap: 10,
  gridTemplateColumns: "auto minmax(120px, 1fr) auto auto",
  padding: "10px 12px",
};

const buttonStyle: CSSProperties = {
  alignItems: "center",
  background: "#202838",
  border: "1px solid #374156",
  borderRadius: 8,
  color: "inherit",
  cursor: "pointer",
  display: "inline-flex",
  font: "inherit",
  justifyContent: "center",
  minHeight: 34,
  padding: "0 10px",
};

export function PlaybackControls(props: PlaybackControlsProps): ReactElement {
  const playing = props.status === "playing";
  return (
    <div aria-label="Animation playback" className={props.className} role="group" style={{ ...transportStyle, ...props.style }}>
      <div style={{ display: "flex", gap: 6 }}>
        <button aria-label="Restart animation" onClick={props.onRestart} style={buttonStyle} type="button">↺</button>
        <button aria-label={playing ? "Pause animation" : "Play animation"} onClick={playing ? props.onPause : props.onPlay} style={{ ...buttonStyle, background: playing ? "#30405a" : "#215fd1", minWidth: 66 }} type="button">
          {playing ? "Pause" : "Play"}
        </button>
      </div>
      <label style={{ alignItems: "center", display: "grid", gap: 8, gridTemplateColumns: "auto 1fr auto" }}>
        <span>Time</span>
        <input aria-label="Animation time" max={props.durationMs} min={0} onChange={(event) => props.onSeek(Number(event.currentTarget.value))} step={1} style={{ accentColor: "#4a8cff", width: "100%" }} type="range" value={Math.min(props.timeMs, props.durationMs)} />
        <span style={{ color: "#9eabc0", minWidth: 88, textAlign: "right" }}>{formatTime(props.timeMs)} / {formatTime(props.durationMs)}</span>
      </label>
      <label style={{ alignItems: "center", display: "flex", gap: 6 }}>
        <span>Speed</span>
        <select aria-label="Playback speed" onChange={(event) => props.onSpeedChange(Number(event.currentTarget.value))} style={{ ...buttonStyle, minHeight: 34 }} value={props.speed}>
          {[0.5, 1, 1.5, 2].map((speed) => <option key={speed} value={speed}>{speed}×</option>)}
        </select>
      </label>
      <label style={{ alignItems: "center", cursor: "pointer", display: "flex", gap: 6 }}>
        <input checked={props.loop} onChange={(event) => props.onLoopChange(event.currentTarget.checked)} style={{ accentColor: "#4a8cff" }} type="checkbox" />
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
