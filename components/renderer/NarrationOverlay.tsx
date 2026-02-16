"use client";

import React from "react";
import type { NarrationItem } from "@/core/types";

interface NarrationOverlayProps {
  narration: NarrationItem | null;
}

export function NarrationOverlay({ narration }: NarrationOverlayProps) {
  if (!narration) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-6 shadow-lg">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {narration.title}
        </h3>
        <p className="text-gray-700 leading-relaxed">{narration.text}</p>
      </div>
    </div>
  );
}
