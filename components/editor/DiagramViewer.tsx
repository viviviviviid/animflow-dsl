"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { parseDsl } from "@/core/parser/dsl-parser";
import { calculateFlowchartLayout } from "@/core/layout/flowchart-layout";
import { AnimationTimeline } from "@/core/animation/timeline";
import { DiagramRenderer } from "@/components/renderer/DiagramRenderer";
import { NarrationOverlay } from "@/components/renderer/NarrationOverlay";
import { PlaybackControls } from "@/components/controls/PlaybackControls";
import { useDiagramStore } from "@/store/diagram-store";
import type { DiagramData } from "@/core/types";

interface DiagramViewerProps {
  dslText: string;
}

export function DiagramViewer({ dslText }: DiagramViewerProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const timelineRef = useRef<AnimationTimeline | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localDiagramData, setLocalDiagramData] = useState<DiagramData | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const {
    isPlaying,
    setDuration,
    setCurrentTime,
    setCurrentStep,
    setIsPlaying,
    currentNarration,
    setCurrentNarration,
    renderMode,
    setRenderMode,
  } = useDiagramStore();

  // Parse DSL and create diagram
  useEffect(() => {
    if (!dslText.trim()) {
      setLocalDiagramData(null);
      setError(null);
      return;
    }

    try {
      // Parse DSL
      const parseResult = parseDsl(dslText);
      
      if (!parseResult.success || !parseResult.data) {
        setError("DSL 파싱 실패");
        return;
      }

      let data = parseResult.data;

      // Calculate layout
      const { nodes, edges } = calculateFlowchartLayout(
        data.nodes,
        data.edges,
        data.metadata.direction
      );

      // Update diagram data with positioned nodes
      data = {
        ...data,
        nodes,
        edges,
      };

      setLocalDiagramData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    }
  }, [dslText]);

  // Build animation timeline when diagram data or render mode changes
  useEffect(() => {
    if (!svgRef.current || !localDiagramData) return;

    // Clear previous timeline
    if (timelineRef.current) {
      timelineRef.current.pause();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!svgRef.current) return;

    // Create timeline - no delay needed, rough elements are in JSX!
    const timeline = new AnimationTimeline(localDiagramData, {
      onStepChange: (step) => {
        setCurrentStep(step);
        const narrationForStep =
          localDiagramData.narrations.find((n) => n.step === step) || null;
        if (narrationForStep) {
          setCurrentNarration(narrationForStep);
        }
      },
    });
    timeline.buildTimeline(svgRef.current);
    timelineRef.current = timeline;

    setDuration(timeline.getDuration());

    // Auto-play if configured
    if (localDiagramData.config.autoplay) {
      timeline.play();
      setIsPlaying(true);
    }

    // Update current time periodically
    intervalRef.current = setInterval(() => {
      if (timelineRef.current) {
        const time = timelineRef.current.getCurrentTime();
        const duration = timelineRef.current.getDuration();
        setCurrentTime(time);

        // Playback reached the end: switch UI back to "start".
        if (duration > 0 && time >= duration - 0.01 && !timelineRef.current.isPlaying()) {
          setIsPlaying(false);
        }
      }
    }, 100);

    // Set initial narration
    if (localDiagramData.narrations.length > 0) {
      setCurrentNarration(localDiagramData.narrations[0]);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    localDiagramData,
    renderMode,
    setDuration,
    setCurrentTime,
    setCurrentStep,
    setIsPlaying,
    setCurrentNarration,
  ]);

  // Handle SVG ready callback
  const handleSvgReady = useCallback((svg: SVGSVGElement) => {
    svgRef.current = svg;
  }, []);

  // Playback handlers
  const handlePlay = () => {
    if (timelineRef.current) {
      timelineRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (timelineRef.current) {
      timelineRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTogglePlayPause = () => {
    if (!timelineRef.current) return;

    if (isPlaying) {
      handlePause();
    } else {
      const current = timelineRef.current.getCurrentTime();
      const duration = timelineRef.current.getDuration();
      const isAtEnd = duration > 0 && current >= duration - 0.01;

      // If playback already finished, start again from the beginning.
      if (isAtEnd) {
        timelineRef.current.restart();
      }
      handlePlay();
    }
  };

  const handleStop = () => {
    if (timelineRef.current) {
      timelineRef.current.stop();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (timelineRef.current) {
      timelineRef.current.setSpeed(speed);
    }
  };

  const handleToggleRenderMode = () => {
    setRenderMode(renderMode === "clean" ? "sketchy" : "clean");
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(2, Number((prev + 0.1).toFixed(1))));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.5, Number((prev - 0.1).toFixed(1))));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    panStartRef.current = {
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    };
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !panStartRef.current) return;
    setPanOffset({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    panStartRef.current = null;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">오류 발생</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!localDiagramData) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-400">DSL 코드를 입력하세요</p>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlayPause}
            className={`p-2 rounded-lg text-white border shadow-md ${
              isPlaying
                ? "bg-amber-500 hover:bg-amber-600 border-amber-600"
                : "bg-emerald-500 hover:bg-emerald-600 border-emerald-600"
            }`}
            title={isPlaying ? "일시정지" : "시작"}
            aria-label={isPlaying ? "일시정지" : "시작"}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            onClick={handleStop}
            className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 border border-red-600 shadow-md"
            title="정지"
            aria-label="정지"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Render Mode Toggle Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleToggleRenderMode}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm
            transition-all duration-200 shadow-md hover:shadow-lg
            flex items-center gap-2
            ${renderMode === "sketchy" 
              ? "bg-amber-500 text-white hover:bg-amber-600" 
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }
          `}
          title={renderMode === "clean" ? "손그림 모드로 전환" : "깔끔한 모드로 전환"}
        >
          {renderMode === "sketchy" ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>손그림</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>깔끔</span>
            </>
          )}
        </button>
      </div>

      {/* Diagram */}
      <div
        className={`flex-1 overflow-hidden bg-white ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            transition: isDragging ? "none" : "transform 120ms ease-out",
          }}
        >
          <DiagramRenderer 
            data={localDiagramData} 
            onReady={handleSvgReady}
            renderMode={renderMode}
            zoom={zoomLevel}
          />
        </div>
      </div>

      {/* Narration Overlay */}
      {localDiagramData.config.narration !== false && (
        <NarrationOverlay narration={currentNarration} />
      )}

      {/* Playback Controls */}
      {localDiagramData.config.controls !== false && (
        <PlaybackControls
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onSpeedChange={handleSpeedChange}
        />
      )}
    </div>
  );
}
