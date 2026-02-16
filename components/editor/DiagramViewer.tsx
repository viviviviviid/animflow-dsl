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
  const timelineRef = useRef<AnimationTimeline | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localDiagramData, setLocalDiagramData] = useState<DiagramData | null>(null);

  const {
    setDuration,
    setCurrentTime,
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
    const timeline = new AnimationTimeline(localDiagramData);
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
        setCurrentTime(timelineRef.current.getCurrentTime());
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
  }, [localDiagramData, renderMode, setDuration, setCurrentTime, setIsPlaying, setCurrentNarration]);

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
      <div className="flex-1 overflow-hidden bg-white">
        <DiagramRenderer 
          data={localDiagramData} 
          onReady={handleSvgReady}
          renderMode={renderMode}
        />
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
