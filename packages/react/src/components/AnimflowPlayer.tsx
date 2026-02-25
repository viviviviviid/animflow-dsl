"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo, useImperativeHandle, forwardRef } from "react";
import { parseDsl } from "../core/parser/dsl-parser";
import { calculateFlowchartLayout } from "../core/layout/flowchart-layout";
import { AnimationTimeline } from "../core/animation/timeline";
import { DiagramRenderer } from "./renderer/DiagramRenderer";
import { NarrationOverlay } from "./renderer/NarrationOverlay";
import { PlaybackControls } from "./controls/PlaybackControls";
import { useDiagramStore } from "../store/diagram-store";
import { useTTS } from "../hooks/useTTS";
import type { DiagramData } from "../core/types";

export interface AnimflowPlayerProps {
  dsl: string;
  autoplay?: boolean;
  controls?: boolean;
  narration?: boolean;
  className?: string;
  onError?: (error: string) => void;
  onReady?: (data: DiagramData) => void;
}

export interface AnimflowPlayerRef {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setSpeed: (speed: number) => void;
  restart: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
}

export const AnimflowPlayer = forwardRef<AnimflowPlayerRef, AnimflowPlayerProps>(
  function AnimflowPlayer(
    {
      dsl,
      autoplay = false,
      controls = true,
      narration = true,
      className = "",
      onError,
      onReady,
    },
    ref
  ) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const panStartRef = useRef<{
      clientX: number;
      clientY: number;
      panX: number;
      panY: number;
    } | null>(null);
    const timelineRef = useRef<AnimationTimeline | null>(null);
    const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isDraggingRef = useRef(false);
    const panRafRef = useRef<number | null>(null);
    const pendingPanRef = useRef<{ x: number; y: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [localDiagramData, setLocalDiagramData] = useState<DiagramData | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [stepBoundaries, setStepBoundaries] = useState<
      { step: number; start: number; end: number }[]
    >([]);

    const narrationStepDetails = useMemo(() => {
      if (!localDiagramData) return {};
      const details: Record<number, { title?: string; text?: string }> = {};

      for (const narration of localDiagramData.narrations) {
        const title =
          typeof narration.title === "string" && narration.title.trim().length > 0
            ? narration.title.trim()
            : undefined;
        const text =
          typeof narration.text === "string" && narration.text.trim().length > 0
            ? narration.text.trim()
            : undefined;

        if (title || text) {
          details[narration.step] = { title, text };
        }
      }

      return details;
    }, [localDiagramData]);

    const narrationBoundaries = useMemo(() => {
      if (!localDiagramData || stepBoundaries.length === 0) return stepBoundaries;

      const sortedNarrationSteps = Array.from(
        new Set(localDiagramData.narrations.map((n) => n.step))
      )
        .sort((a, b) => a - b)
        .filter((step) => stepBoundaries.some((b) => b.step === step));

      if (sortedNarrationSteps.length === 0) {
        return stepBoundaries;
      }

      const segments: { step: number; start: number; end: number }[] = [];
      const lastTimelineEnd = stepBoundaries[stepBoundaries.length - 1]?.end ?? 0;

      for (let i = 0; i < sortedNarrationSteps.length; i += 1) {
        const step = sortedNarrationSteps[i];
        const current = stepBoundaries.find((b) => b.step === step);
        if (!current) continue;

        const nextNarrationStep = sortedNarrationSteps[i + 1];
        const next = nextNarrationStep
          ? stepBoundaries.find((b) => b.step === nextNarrationStep)
          : undefined;

        const start = current.start;
        const end = next?.start ?? lastTimelineEnd;
        segments.push({
          step,
          start,
          end: end > start ? end : current.end,
        });
      }

      return segments.length > 0 ? segments : stepBoundaries;
    }, [localDiagramData, stepBoundaries]);

    const {
      isPlaying,
      setDuration,
      setCurrentTime,
      setCurrentStep,
      setIsPlaying,
      setSpeed,
      currentNarration,
      setCurrentNarration,
    } = useDiagramStore();

    // TTS mode — initialised from DSL config, toggled by the user (disabled while playing)
    const [ttsMode, setTtsMode] = useState(false);
    const ttsModeRef = useRef(ttsMode);
    ttsModeRef.current = ttsMode;

    const [ttsVolume, setTtsVolume] = useState(1.0);

    // True when the timeline was paused mid-animation to wait for TTS to finish
    const pausedForTTSRef = useRef(false);

    const tts = useTTS({
      enabled: ttsMode,
      voiceName: localDiagramData?.config.ttsVoice,
      rate: localDiagramData?.config.ttsRate,
      pitch: localDiagramData?.config.ttsPitch,
      volume: ttsVolume,
      onEnd: () => {
        // Speech finished naturally — resume timeline only if WE paused it for TTS
        if (pausedForTTSRef.current) {
          pausedForTTSRef.current = false;
          timelineRef.current?.play();
          setIsPlaying(true);
        }
      },
    });
    // Stable ref so tts methods can be used in effects/callbacks without causing re-runs
    const ttsRef = useRef(tts);
    ttsRef.current = tts;

    // Parse DSL and create diagram
    useEffect(() => {
      if (!dsl.trim()) {
        setLocalDiagramData(null);
        setError(null);
        return;
      }

      try {
        const parseResult = parseDsl(dsl);
        
        if (!parseResult.success || !parseResult.data) {
          const errorMsg = "DSL 파싱 실패";
          setError(errorMsg);
          onError?.(errorMsg);
          return;
        }

        let data = parseResult.data;

        const { nodes, edges } = calculateFlowchartLayout(
          data.nodes,
          data.edges,
          data.metadata.direction
        );

        data = {
          ...data,
          nodes,
          edges,
          config: {
            ...data.config,
            autoplay: autoplay ?? data.config.autoplay,
            controls: controls ?? data.config.controls,
            narration: narration ?? data.config.narration,
          },
        };

        setLocalDiagramData(data);
        setError(null);
        onReady?.(data);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "알 수 없는 오류";
        setError(errorMsg);
        onError?.(errorMsg);
      }
    }, [dsl, autoplay, controls, narration, onError, onReady]);

    // Build animation timeline
    useEffect(() => {
      if (!svgRef.current || !localDiagramData) return;

      if (timelineRef.current) {
        timelineRef.current.pause();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // 템플릿/DSL 변경 시 재생 상태 및 뷰포트 리셋
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentStep(0);
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
      pausedForTTSRef.current = false;

      // Sync ttsMode from new DSL config
      setTtsMode(localDiagramData.config.tts ?? false);

      if (!svgRef.current) return;

      const timeline = new AnimationTimeline(localDiagramData, {
        onStepChange: (step) => {
          setCurrentStep(step);
          const narrationForStep =
            localDiagramData.narrations.find((n) => n.step === step) || null;
          if (narrationForStep) {
            setCurrentNarration(narrationForStep);
            // Only speak when TTS mode is on
            if (ttsModeRef.current) {
              ttsRef.current.speak(narrationForStep.text);
            }
          }
        },
        onStepComplete: () => {
          // If TTS mode is on and speech is still in progress, pause the timeline
          // and wait for the onEnd callback to resume it.
          if (ttsModeRef.current && ttsRef.current.isSpeakingRef.current) {
            pausedForTTSRef.current = true;
            timelineRef.current?.pause();
            setIsPlaying(false);
          }
        },
      });
      timeline.buildTimeline(svgRef.current);
      timelineRef.current = timeline;
      setStepBoundaries(timeline.getStepBoundaries());

      setDuration(timeline.getDuration());

      if (localDiagramData.config.autoplay) {
        timeline.play();
        setIsPlaying(true);
      }

      intervalRef.current = setInterval(() => {
        if (timelineRef.current) {
          if (isDraggingRef.current) return;
          const time = timelineRef.current.getCurrentTime();
          const duration = timelineRef.current.getDuration();
          setCurrentTime(time);

          if (duration > 0 && time >= duration - 0.01 && !timelineRef.current.isPlaying()) {
            setIsPlaying(false);
          }
        }
      }, 33);

      if (localDiagramData.narrations.length > 0) {
        setCurrentNarration(localDiagramData.narrations[0]);
      }

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        ttsRef.current.cancel();
      };
    }, [
      localDiagramData,
      setDuration,
      setCurrentTime,
      setCurrentStep,
      setIsPlaying,
      setCurrentNarration,
    ]);

    useEffect(() => {
      return () => {
        if (panRafRef.current !== null) {
          window.cancelAnimationFrame(panRafRef.current);
          panRafRef.current = null;
        }
      };
    }, []);

    const handleSvgReady = useCallback((svg: SVGSVGElement) => {
      svgRef.current = svg;
    }, []);

    const handlePlay = useCallback(() => {
      if (timelineRef.current) {
        pausedForTTSRef.current = false; // user explicitly resumed — clear TTS-pause flag
        const current = timelineRef.current.getCurrentTime();
        const duration = timelineRef.current.getDuration();
        const isAtEnd = duration > 0 && current >= duration - 0.01;

        if (isAtEnd) {
          timelineRef.current.restart();
          ttsRef.current.cancel();
        } else {
          ttsRef.current.resume();
        }
        timelineRef.current.play();
        setIsPlaying(true);
      }
    }, [setIsPlaying]);

    const handlePause = useCallback(() => {
      if (timelineRef.current) {
        pausedForTTSRef.current = false; // user-initiated pause — don't auto-resume on TTS end
        timelineRef.current.pause();
        ttsRef.current.pause();
        setIsPlaying(false);
      }
    }, [setIsPlaying]);

    const handleStop = useCallback(() => {
      if (timelineRef.current) {
        pausedForTTSRef.current = false;
        timelineRef.current.stop();
        ttsRef.current.cancel();
        setIsPlaying(false);
        setCurrentTime(0);
      }
    }, [setIsPlaying, setCurrentTime]);

    // Reset animation to start when toggling TTS mode to avoid pacing state inconsistencies
    const handleTtsModeToggle = useCallback(() => {
      if (timelineRef.current) {
        timelineRef.current.stop();
        setCurrentTime(0);
      }
      ttsRef.current.cancel();
      pausedForTTSRef.current = false;
      setIsPlaying(false);
      setTtsMode((prev) => !prev);
    }, [setIsPlaying, setCurrentTime]);

    const handleSpeedChange = useCallback((speed: number) => {
      if (timelineRef.current) {
        timelineRef.current.setSpeed(speed);
        setSpeed(speed); // sync store so PlaybackControls re-renders with new value
      }
    }, [setSpeed]);

    const handleSeekToTime = useCallback((time: number) => {
      if (!timelineRef.current || !localDiagramData) return;
      pausedForTTSRef.current = false; // seek breaks TTS pacing — don't auto-resume
      timelineRef.current.seek(time);
      ttsRef.current.cancel();
      setCurrentTime(time);

      const matched =
        stepBoundaries.find((b) => time >= b.start && time <= b.end) ||
        stepBoundaries.find((b) => time < b.start) ||
        null;

      if (matched) {
        setCurrentStep(matched.step);
        const narrationForStep =
          localDiagramData.narrations.find((n) => n.step === matched.step) || null;
        if (narrationForStep) {
          setCurrentNarration(narrationForStep);
        }
      }
    }, [localDiagramData, stepBoundaries, setCurrentTime, setCurrentStep, setCurrentNarration]);

    const handleZoomIn = useCallback(() => {
      setZoomLevel((prev) => Math.min(2, Number((prev + 0.1).toFixed(1))));
    }, []);

    const handleZoomOut = useCallback(() => {
      setZoomLevel((prev) => Math.max(0.5, Number((prev - 0.1).toFixed(1))));
    }, []);

    const handleZoomReset = useCallback(() => {
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
    }, []);

    const handlePointerDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      isDraggingRef.current = true;
      setIsDragging(true);
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        panX: panOffset.x,
        panY: panOffset.y,
      };
    }, [panOffset]);

    const handlePointerMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current || !panStartRef.current) return;
      e.preventDefault();
      const safeZoom = Math.max(0.5, Math.min(2, zoomLevel));
      const dx = e.clientX - panStartRef.current.clientX;
      const dy = e.clientY - panStartRef.current.clientY;
      const nextPan = {
        x: panStartRef.current.panX + dx / safeZoom,
        y: panStartRef.current.panY + dy / safeZoom,
      };

      pendingPanRef.current = nextPan;
      if (panRafRef.current === null) {
        panRafRef.current = window.requestAnimationFrame(() => {
          if (pendingPanRef.current) {
            setPanOffset(pendingPanRef.current);
          }
          panRafRef.current = null;
        });
      }
    }, [zoomLevel]);

    const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoomLevel((prev) => Math.max(0.5, Math.min(2, Number((prev + delta).toFixed(1)))));
      } else {
        setPanOffset((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    }, []);

    const handlePointerUp = useCallback(() => {
      if (pendingPanRef.current) {
        setPanOffset(pendingPanRef.current);
        pendingPanRef.current = null;
      }
      if (panRafRef.current !== null) {
        window.cancelAnimationFrame(panRafRef.current);
        panRafRef.current = null;
      }
      isDraggingRef.current = false;
      if (timelineRef.current) {
        setCurrentTime(timelineRef.current.getCurrentTime());
      }
      setIsDragging(false);
      panStartRef.current = null;
    }, [setCurrentTime]);

    // Expose imperative methods via ref
    useImperativeHandle(ref, () => ({
      play: handlePlay,
      pause: handlePause,
      stop: handleStop,
      seek: handleSeekToTime,
      setSpeed: handleSpeedChange,
      restart: () => {
        if (timelineRef.current) {
          timelineRef.current.restart();
          setIsPlaying(true);
        }
      },
      getCurrentTime: () => timelineRef.current?.getCurrentTime() ?? 0,
      getDuration: () => timelineRef.current?.getDuration() ?? 0,
      isPlaying: () => timelineRef.current?.isPlaying() ?? false,
    }), [handlePlay, handlePause, handleStop, handleSeekToTime, handleSpeedChange, setIsPlaying]);

    if (error) {
      return (
        <div className={`flex items-center justify-center h-full bg-red-50 ${className}`}>
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-2">오류 발생</p>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      );
    }

    if (!localDiagramData) {
      return (
        <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      );
    }

    const canvasBackground = localDiagramData.config.background ?? "#faf9f6";

    return (
      <div className={`relative h-full flex flex-col ${className}`}>
        {/* Zoom Controls */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="px-3 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-md text-sm font-medium"
              title="축소"
            >
              -
            </button>
            <button
              onClick={handleZoomIn}
              className="px-3 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-md text-sm font-medium"
              title="확대"
            >
              +
            </button>
            <button
              onClick={handleZoomReset}
              className="px-3 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-md text-sm font-medium"
              title="원래 크기"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
          </div>
        </div>

        {/* Diagram */}
        <div
          className={`relative flex-1 overflow-hidden select-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={canvasBackground !== "transparent" ? { background: canvasBackground } : undefined}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onWheel={handleWheel}
          onDragStart={(e) => e.preventDefault()}
        >
          <DiagramRenderer
            data={localDiagramData}
            onReady={handleSvgReady}
            zoom={zoomLevel}
            pan={panOffset}
          />

          {/* Narration Overlay — absolutely positioned so it doesn't shift the diagram */}
          {localDiagramData.config.narration !== false && narration && (
            <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
              <NarrationOverlay narration={currentNarration} />
            </div>
          )}
        </div>

        {/* Playback Controls */}
        {localDiagramData.config.controls !== false && controls && (
          <PlaybackControls
            onPlay={handlePlay}
            onPause={handlePause}
            onSpeedChange={handleSpeedChange}
            onSeekToTime={handleSeekToTime}
            stepBoundaries={narrationBoundaries}
            stepDetails={narrationStepDetails}
            ttsMode={ttsMode}
            onTtsModeToggle={handleTtsModeToggle}
            ttsVolume={ttsVolume}
            onTtsVolumeChange={setTtsVolume}
          />
        )}
      </div>
    );
  }
);
