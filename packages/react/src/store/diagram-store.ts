import { createStore } from "zustand/vanilla";
import type { DiagramData, NarrationItem } from "../core/types";

export interface DiagramStore {
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
}

export function createDiagramStore() {
  return createStore<DiagramStore>((set) => ({
    // Initial state
    diagramData: null,
    isPlaying: false,
    currentStep: 0,
    currentTime: 0,
    duration: 0,
    speed: 1.0,
    currentNarration: null,

    // Actions
    setDiagramData: (data) => set({ diagramData: data }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    setCurrentStep: (step) => set({ currentStep: step }),
    setCurrentTime: (time) => set({ currentTime: time }),
    setDuration: (duration) => set({ duration }),
    setSpeed: (speed) => set({ speed }),
    setCurrentNarration: (narration) => set({ currentNarration: narration }),
  }));
}

export type DiagramStoreApi = ReturnType<typeof createDiagramStore>;
