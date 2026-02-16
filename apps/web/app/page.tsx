"use client";

import React, { useState } from "react";
import Split from "react-split";
import { AnimflowPlayer } from "@animflow-dsl/react";
import { DslEditor } from "@/components/editor/DslEditor";
import { TEMPLATES } from "@/data/templates";

export default function HomePage() {
  const [dslText, setDslText] = useState(TEMPLATES[0].dsl);
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  const handleTemplateChange = (index: number) => {
    setSelectedTemplate(index);
    setDslText(TEMPLATES[index].dsl);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white p-4 shadow-lg">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">AnimDiagram</h1>
          
          {/* Controls */}
          <div className="flex items-center gap-6">
            {/* Template Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm">템플릿:</label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(Number(e.target.value))}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white border border-white/20"
              >
                {TEMPLATES.map((template, index) => (
                  <option key={index} value={index} className="text-gray-900">
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Resizable Split */}
      <Split
        sizes={[50, 50]}
        minSize={300}
        gutterSize={8}
        className="flex flex-1 overflow-hidden"
      >
        {/* Editor Panel */}
        <div className="flex flex-col h-full">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
            <h2 className="font-semibold text-gray-700">DSL 에디터</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <DslEditor value={dslText} onChange={setDslText} />
          </div>
        </div>

        {/* Viewer Panel */}
        <div className="flex flex-col h-full">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
            <h2 className="font-semibold text-gray-700">다이어그램 뷰어</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <AnimflowPlayer dsl={dslText} />
          </div>
        </div>
      </Split>
    </div>
  );
}
