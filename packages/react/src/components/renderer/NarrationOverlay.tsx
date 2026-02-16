"use client";

import React from "react";
import type { NarrationItem } from "../../core/types";

interface NarrationOverlayProps {
  narration: NarrationItem | null;
}

export function NarrationOverlay({ narration }: NarrationOverlayProps) {
  if (!narration) return null;

  return (
    <div className="relative border-t border-gray-200 bg-gray-50/95 px-4 py-3">
      <div className="mx-auto max-w-5xl">
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          {narration.title}
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">{narration.text}</p>
      </div>
    </div>
  );
}
