"use client";

import React from "react";
import { useDiagramStore } from "@/store/diagram-store";

interface PlaybackControlsProps {
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSpeedChange: (speed: number) => void;
}

export function PlaybackControls({
  onPlay,
  onPause,
  onStop,
  onSpeedChange,
}: PlaybackControlsProps) {
  const { isPlaying, currentTime, duration, speed } = useDiagramStore();

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Progress Bar */}
        <div className="relative">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {/* Stop */}
          <button
            onClick={onStop}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="정지"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="6" y="6" width="12" height="12" />
            </svg>
          </button>

          {/* Play/Pause */}
          {!isPlaying ? (
            <button
              onClick={onPlay}
              className="p-3 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
              title="재생"
            >
              <svg
                className="w-8 h-8"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={onPause}
              className="p-3 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
              title="일시정지"
            >
              <svg
                className="w-8 h-8"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            </button>
          )}

          {/* Speed Control */}
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-gray-600">속도:</span>
            <div className="flex gap-1">
              {[0.5, 1.0, 1.5, 2.0].map((s) => (
                <button
                  key={s}
                  onClick={() => onSpeedChange(s)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    speed === s
                      ? "bg-primary text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
