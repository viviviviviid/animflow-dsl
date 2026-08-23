"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import Split from "react-split";
import type { Diagnostic } from "@animflow-dsl/model";
import { migrateV1ToV2 } from "@animflow-dsl/migrate";
import { DslEditor } from "@/components/editor/DslEditor";
import { V2Player } from "@/components/v2/V2Player";
import { TEMPLATES } from "@/data/templates";
import { DEFAULT_V2_SOURCE } from "@/data/v2-default";

export default function HomePage() {
  const [source, setSource] = useState(DEFAULT_V2_SOURCE);
  const [diagnostics, setDiagnostics] = useState<readonly Diagnostic[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("v2-default");
  const [migrationNote, setMigrationNote] = useState<string | null>(null);
  const handleDiagnostics = useCallback(
    (next: readonly Diagnostic[]) => setDiagnostics(next),
    [],
  );

  const selectTemplate = async (value: string) => {
    setSelectedTemplate(value);
    if (value === "v2-default") {
      setSource(DEFAULT_V2_SOURCE);
      setMigrationNote(null);
      return;
    }
    const template = TEMPLATES[Number(value)];
    const migration = await migrateV1ToV2(template.dsl);
    if (!migration.ok) {
      setDiagnostics(migration.diagnostics);
      setMigrationNote("Migration blocked. Review the diagnostics below.");
      return;
    }
    setSource(migration.value.source);
    setDiagnostics(migration.diagnostics);
    setMigrationNote(
      `Migrated ${migration.value.manifest.inputAnimationSteps} scenes and ${migration.value.manifest.inputNarrations} narrations from v1.`,
    );
  };

  const errors = diagnostics.filter((item) => item.severity === "error").length;
  return (
    <main className="flex h-screen flex-col bg-[#0b0f16] text-slate-100">
      <header className="flex min-h-[72px] items-center justify-between border-b border-slate-800 bg-[#0d121a] px-5">
        <div className="flex items-center gap-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-blue-400/30 bg-blue-500/10 font-mono text-sm font-bold text-blue-300">AF</div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-blue-300">Deterministic scene compiler</p>
            <h1 className="text-lg font-semibold tracking-tight">AnimFlow DSL v2</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="max-w-[320px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-400"
            onChange={(event) => void selectTemplate(event.target.value)}
            value={selectedTemplate}
          >
            <option value="v2-default">V2 — Payment signal</option>
            {TEMPLATES.map((template, index) => (
              <option key={template.name} value={index}>Migrate — {template.name}</option>
            ))}
          </select>
          <Link className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-white" href="/legacy">Legacy v1</Link>
        </div>
      </header>

      <div className="flex items-center justify-between border-b border-slate-800 bg-[#101722] px-5 py-2 font-mono text-[11px] text-slate-400">
        <span>{migrationNote ?? "Edit source; compile diagnostics update after 180 ms."}</span>
        <span className={errors ? "text-red-300" : "text-emerald-300"}>{errors ? `${errors} blocking` : "RenderPlan valid"}</span>
      </div>

      <Split className="flex min-h-0 flex-1" gutterSize={8} minSize={360} sizes={[46, 54]}>
        <section className="flex min-h-0 flex-col border-r border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 bg-[#0d121a] px-4 py-2">
            <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-slate-300">Source · .animflow</h2>
            <span className="text-xs text-slate-500">{source.split("\n").length} lines</span>
          </div>
          <div className="min-h-0 flex-1"><DslEditor diagnostics={diagnostics} onChange={setSource} value={source} /></div>
          {diagnostics.length ? (
            <div className="max-h-32 overflow-auto border-t border-slate-800 bg-[#111722] px-4 py-2 font-mono text-[11px]">
              {diagnostics.map((item, index) => (
                <div className={item.severity === "error" ? "text-red-300" : "text-amber-300"} key={`${item.code}-${item.range.start.offset}-${index}`}>
                  {item.code} · L{item.range.start.line + 1}:{item.range.start.character + 1} · {item.message}
                </div>
              ))}
            </div>
          ) : null}
        </section>
        <section className="min-h-0 overflow-hidden"><V2Player onDiagnostics={handleDiagnostics} source={source} /></section>
      </Split>
    </main>
  );
}
