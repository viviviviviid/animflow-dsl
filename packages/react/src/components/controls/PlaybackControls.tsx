"use client";

import React from "react";
import { useDiagramStore } from "../../store/diagram-store";

interface PlaybackControlsProps {
  onPlay: () => void;
  onPause: () => void;
  onSpeedChange: (speed: number) => void;
  onSeekToTime: (time: number) => void;
  stepBoundaries: { step: number; start: number; end: number }[];
  stepDetails?: Record<number, { title?: string; text?: string }>;
}

export function PlaybackControls({
  onPlay,
  onPause,
  onSpeedChange,
  onSeekToTime,
  stepBoundaries,
  stepDetails = {},
}: PlaybackControlsProps) {
  const { isPlaying, currentTime, duration, speed } = useDiagramStore();
  const progressBarRef = React.useRef<HTMLDivElement | null>(null);
  const [hoverPercent, setHoverPercent] = React.useState<number | null>(null);
  const [hoverSegmentStep, setHoverSegmentStep] = React.useState<number | null>(null);
  const [hoverTooltipX, setHoverTooltipX] = React.useState<number | null>(null);

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const isHoveringBar = hoverPercent !== null;
  const previewStart = Math.min(clampedProgress, hoverPercent ?? clampedProgress);
  const previewEnd = Math.max(clampedProgress, hoverPercent ?? clampedProgress);
  const previewWidth = Math.max(0, previewEnd - previewStart);

  const handleBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setHoverPercent(percent);
  };

  const handleBarMouseLeave = () => {
    setHoverPercent(null);
    setHoverSegmentStep(null);
    setHoverTooltipX(null);
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="max-w-5xl mx-auto space-y-3">
        {/* YouTube-like control row */}
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          {!isPlaying ? (
            <button
              onClick={onPlay}
              className="shrink-0 p-2 rounded-full text-gray-900 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors"
              title="재생"
              aria-label="재생"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={onPause}
              className="shrink-0 p-2 rounded-full text-gray-900 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors"
              title="일시정지"
              aria-label="일시정지"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            </button>
          )}

          {/* Step Progress Bar (clickable chapters) */}
          <div className="relative flex-1">
          {hoverSegmentStep !== null &&
            hoverTooltipX !== null &&
            (stepDetails[hoverSegmentStep]?.title ||
              stepDetails[hoverSegmentStep]?.text) && (
            <div
              className="pointer-events-none absolute -top-16 z-40 max-w-xs -translate-x-1/2 rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
              style={{ left: `${hoverTooltipX}px` }}
            >
              {stepDetails[hoverSegmentStep]?.title && (
                <div className="font-semibold">
                  {stepDetails[hoverSegmentStep]?.title}
                </div>
              )}
              {stepDetails[hoverSegmentStep]?.text && (
                <div className="mt-1 line-clamp-2 text-gray-200">
                  {stepDetails[hoverSegmentStep]?.text}
                </div>
              )}
            </div>
          )}
            {stepBoundaries.length > 0 ? (
            <div
              ref={progressBarRef}
              className="relative h-3 rounded-full bg-gray-200 p-[1px] transition-all duration-150 hover:h-4"
              onMouseMove={handleBarMouseMove}
              onMouseLeave={handleBarMouseLeave}
            >
              {/* Hover preview range: current dot <-> hover point */}
              {isHoveringBar && previewWidth > 0 && (
                <div
                  className="pointer-events-none absolute top-[1px] bottom-[1px] rounded bg-gray-400/50 z-20"
                  style={{
                    left: `${previewStart}%`,
                    width: `${previewWidth}%`,
                  }}
                />
              )}

              <div className="h-full w-full flex gap-[2px]">
              {stepBoundaries.map((segment, index) => {
                const segmentDuration = Math.max(
                  0.001,
                  segment.end - segment.start
                );
                const playedRatio = Math.max(
                  0,
                  Math.min(
                    1,
                    (currentTime - segment.start) / Math.max(0.001, segmentDuration)
                  )
                );
                return (
                  <button
                    key={`${segment.step}-${index}`}
                    onClick={() => onSeekToTime(segment.start)}
                    onMouseEnter={(e) => {
                      setHoverSegmentStep(segment.step);
                      if (progressBarRef.current) {
                        const barRect = progressBarRef.current.getBoundingClientRect();
                        const targetRect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                        setHoverTooltipX(targetRect.left - barRect.left + targetRect.width / 2);
                      }
                    }}
                    className={`relative h-full min-w-[10px] rounded-[2px] bg-gray-300/90 transition-all duration-150 origin-center overflow-hidden border border-white/90 ${
                      hoverSegmentStep === segment.step ? "scale-y-125" : ""
                    }`}
                    style={{ flexGrow: segmentDuration }}
                    title={
                      stepDetails[segment.step]?.title
                        ? `${stepDetails[segment.step]?.title}로 이동`
                        : `step ${segment.step}로 이동`
                    }
                    aria-label={
                      stepDetails[segment.step]?.title
                        ? `${stepDetails[segment.step]?.title}로 이동`
                        : `step ${segment.step}로 이동`
                    }
                  >
                    <div
                      className="h-full bg-primary transition-[width] duration-100 ease-linear"
                      style={{ width: `${playedRatio * 100}%` }}
                    />
                  </button>
                );
              })}
              </div>

              {/* Current playhead */}
              <div
                className="pointer-events-none absolute top-1/2 z-30 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white border-2 border-primary shadow transition-all duration-100 ease-linear"
                style={{
                  left: `calc(${clampedProgress}% - 7px)`,
                }}
              />
            </div>
            ) : (
            <div
              ref={progressBarRef}
              className="relative h-3 rounded-full bg-gray-200 overflow-hidden transition-all duration-150 hover:h-4"
              onMouseMove={handleBarMouseMove}
              onMouseLeave={handleBarMouseLeave}
            >
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${clampedProgress}%` }}
              />
              {isHoveringBar && previewWidth > 0 && (
                <div
                  className="pointer-events-none absolute top-0 bottom-0 rounded bg-gray-400/50 z-20"
                  style={{
                    left: `${previewStart}%`,
                    width: `${previewWidth}%`,
                  }}
                />
              )}
              <div
                className="pointer-events-none absolute top-1/2 z-30 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white border-2 border-primary shadow transition-all duration-100 ease-linear"
                style={{
                  left: `calc(${clampedProgress}% - 7px)`,
                }}
              />
            </div>
            )}
            <div className="flex justify-between text-[11px] text-gray-500 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
