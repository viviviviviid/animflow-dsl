"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import Split from "react-split";
import { AnimflowPlayer } from "@animflow-dsl/react";
import { TEMPLATES } from "@/data/templates";

const DslEditor = dynamic(
  () => import("@/components/editor/DslEditor").then((module) => module.DslEditor),
  { loading: () => <div className="studio-editor-loading">Loading local source editor…</div>, ssr: false },
);

export default function LegacyPage() {
  const [dslText, setDslText] = useState(TEMPLATES[0].dsl);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between bg-slate-900 px-5 py-3 text-white">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Compatibility entry</p>
          <h1 className="text-lg font-semibold">AnimFlow v1</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
            onChange={(event) => {
              const index = Number(event.target.value);
              setSelectedTemplate(index);
              setDslText(TEMPLATES[index].dsl);
            }}
            value={selectedTemplate}
          >
            {TEMPLATES.map((template, index) => <option key={template.name} value={index}>{template.name}</option>)}
          </select>
          <Link className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500" href="/">Open v2</Link>
        </div>
      </header>
      <Split className="flex min-h-0 flex-1" gutterSize={8} minSize={300} sizes={[50, 50]}>
        <DslEditor language="plaintext" onChange={setDslText} value={dslText} />
        <div className="min-h-0 overflow-hidden"><AnimflowPlayer dsl={dslText} /></div>
      </Split>
    </div>
  );
}
