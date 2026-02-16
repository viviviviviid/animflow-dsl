import { create } from "zustand";
import type { DiagramData, NarrationItem } from "@/core/types";

interface DiagramStore {
  // Diagram data
  diagramData: DiagramData | null;
  setDiagramData: (data: DiagramData | null) => void;

  // Playback state
  isPlaying: boolean;
  currentStep: number;
  currentTime: number;
  duration: number;
  speed: number;

  setIsPlaying: (playing: boolean) => void;
  setCurrentStep: (step: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setSpeed: (speed: number) => void;

  // Narration
  currentNarration: NarrationItem | null;
  setCurrentNarration: (narration: NarrationItem | null) => void;

  // Render mode
  renderMode: "clean" | "sketchy";
  setRenderMode: (mode: "clean" | "sketchy") => void;
}

export const useDiagramStore = create<DiagramStore>((set) => ({
  // Initial state
  diagramData: null,
  isPlaying: false,
  currentStep: 0,
  currentTime: 0,
  duration: 0,
  speed: 1.0,
  currentNarration: null,
  renderMode: "sketchy", // 손그림 모드가 기본

  // Actions
  setDiagramData: (data) => set({ diagramData: data }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setSpeed: (speed) => set({ speed }),
  setCurrentNarration: (narration) => set({ currentNarration: narration }),
  setRenderMode: (mode) => set({ renderMode: mode }),
}));
