"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import type { ActionDraft, AuthoringCommand } from "@animflow-dsl/authoring";
import type {
  CompiledElement,
  CompiledScene,
  Diagnostic,
  FrameState,
  RenderPlan,
  SourceRange,
} from "@animflow-dsl/model";
import { AnimFlowCanvas, type AnimFlowElementSelection } from "@animflow-dsl/react-v2";

import { V2Player } from "@/components/v2/V2Player";
import { BLANK_STUDIO_SOURCE, STUDIO_EXAMPLES, type StudioExample } from "@/data/studio-examples";
import { DEFAULT_V2_SOURCE } from "@/data/v2-default";
import { StudioAuthoringClient } from "@/lib/authoring-client";
import type { StudioAuthoringState } from "@/lib/authoring-protocol";
import {
  deleteStudioDraft,
  listStudioDocuments,
  loadStudioDraft,
  saveStudioDraft,
  type StudioDocumentMetadata,
} from "@/lib/studio-store";
import { useWriterLease } from "@/lib/use-writer-lease";

type SaveState = "idle" | "saving" | "saved" | "error";
type ActionTool = "reveal" | "focus" | "trace" | "hide" | "camera";
type PublishDialogState =
  | { readonly status: "publishing" }
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "published"; readonly url: string; readonly deletionToken: string; readonly expiresAt: string; readonly integrityHash: string };

const DslEditor = dynamic(
  () => import("@/components/editor/DslEditor").then((module) => module.DslEditor),
  { loading: () => <div className="studio-editor-loading">Loading local source editor…</div>, ssr: false },
);

export function Studio() {
  const [documentId, setDocumentId] = useState("local-lesson");
  const [title, setTitle] = useState("Payment signal walkthrough");
  const [authoring, setAuthoring] = useState<StudioAuthoringState | null>(null);
  const [sourceDraft, setSourceDraft] = useState(DEFAULT_V2_SOURCE);
  const [previewDiagnostics, setPreviewDiagnostics] = useState<readonly Diagnostic[]>([]);
  const [plan, setPlan] = useState<RenderPlan | null>(null);
  const [selectedElementIds, setSelectedElementIds] = useState<readonly string[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [seekRequest, setSeekRequest] = useState<{ requestId: number; timeMs: number }>();
  const [stale, setStale] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [documents, setDocuments] = useState<readonly StudioDocumentMetadata[]>([]);
  const [libraryBusy, setLibraryBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("Opening your local lesson…");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [storageError, setStorageError] = useState<string>();
  const [recovered, setRecovered] = useState(false);
  const [narration, setNarration] = useState("");
  const [publishDialog, setPublishDialog] = useState<PublishDialogState | null>(null);
  const [editorRange, setEditorRange] = useState<SourceRange>();
  const clientRef = useRef<StudioAuthoringClient | null>(null);
  const sourceDraftRef = useRef(sourceDraft);
  const sourceSelection = authoring?.selection?.range;
  const writerLease = useWriterLease(documentId);

  useEffect(() => {
    sourceDraftRef.current = sourceDraft;
  }, [sourceDraft]);

  useEffect(() => {
    let cancelled = false;
    const client = new StudioAuthoringClient();
    clientRef.current = client;
    const initialize = async () => {
      try {
        const storedId = localStorage.getItem("animflow-studio-document") ?? documentId;
        if (storedId !== documentId) {
          setDocumentId(storedId);
          return;
        }
        localStorage.setItem("animflow-studio-document", storedId);
        const saved = await loadStudioDraft(storedId);
        if (cancelled) return;
        const source = saved?.source ?? DEFAULT_V2_SOURCE;
        if (saved) {
          setTitle(saved.title);
          setRecovered(true);
        }
        const state = await client.init(source);
        if (cancelled) return;
        setAuthoring(state);
        setSourceDraft(state.source);
        setPreviewDiagnostics(state.diagnostics);
        setNotice(saved ? `Recovered revision ${saved.currentRevision} from this browser.` : "Local draft ready.");
      } catch (error) {
        if (!cancelled) setNotice(error instanceof Error ? error.message : String(error));
      }
    };
    void initialize();
    return () => {
      cancelled = true;
      client.dispose();
      if (clientRef.current === client) clientRef.current = null;
    };
  }, [documentId]);

  useEffect(() => {
    if (!libraryOpen) return;
    let cancelled = false;
    void listStudioDocuments().then((stored) => {
      if (cancelled) return;
      const current = authoring && !stored.some((document) => document.documentId === documentId)
        ? [{ documentId, title, currentRevision: authoring.documentRevision, updatedAt: Date.now() }, ...stored]
        : stored;
      setDocuments(current);
    }, (error: unknown) => {
      if (!cancelled) setNotice(error instanceof Error ? error.message : String(error));
    });
    return () => { cancelled = true; };
  }, [authoring, documentId, libraryOpen, title]);

  useEffect(() => {
    if (!authoring || sourceDraft === authoring.source || writerLease.status !== "writer") return;
    const timer = window.setTimeout(async () => {
      const client = clientRef.current;
      if (!client) return;
      try {
        const response = await client.execute({
          type: "source.replace",
          baseRevision: authoring.documentRevision,
          source: sourceDraft,
        });
        setAuthoring(response.state);
        if (sourceDraftRef.current === sourceDraft) setSourceDraft(response.state.source);
        if (response.result?.status === "applied-invalid-draft") {
          setNotice("Draft saved with errors. Preview remains on the last valid revision.");
        }
      } catch (error) {
        setNotice(error instanceof Error ? error.message : String(error));
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [authoring, sourceDraft, writerLease.status]);

  useEffect(() => {
    if (!authoring || writerLease.status !== "writer") return;
    setSaveState("saving");
    const save = () => {
      void saveStudioDraft({
        documentId,
        title,
        currentRevision: authoring.documentRevision,
        source: authoring.source,
        updatedAt: Date.now(),
      }).then(
        () => {
          setSaveState("saved");
          setStorageError(undefined);
        },
        (error: unknown) => {
          setSaveState("error");
          setStorageError(error instanceof Error ? error.message : String(error));
        },
      );
    };
    const idleWindow = window as Window & {
      requestIdleCallback?: Window["requestIdleCallback"];
      cancelIdleCallback?: Window["cancelIdleCallback"];
    };
    const usesIdleCallback = typeof idleWindow.requestIdleCallback === "function";
    const idleId = usesIdleCallback
      ? idleWindow.requestIdleCallback!(save, { timeout: 1_200 })
      : window.setTimeout(save, 700);
    return () => {
      if (usesIdleCallback) idleWindow.cancelIdleCallback?.(idleId);
      else window.clearTimeout(idleId);
    };
  }, [authoring, documentId, title, writerLease.status]);

  const applyCommand = useCallback(async (command: AuthoringCommand) => {
    const client = clientRef.current;
    if (!client) return false;
    setBusy(true);
    try {
      const response = await client.execute(command);
      setAuthoring(response.state);
      if (response.result?.status === "rejected") {
        setNotice(response.result.diagnostics[0]?.message ?? "The edit was rejected.");
        return false;
      }
      setSourceDraft(response.state.source);
      setNotice(`Saved ${response.result?.transactionId ?? "transaction"}.`);
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const handlePlan = useCallback((nextPlan: RenderPlan) => {
    setPlan(nextPlan);
    setActiveSceneId((current) =>
      current && nextPlan.scenes.some((scene) => scene.id === current)
        ? current
        : nextPlan.scenes[0]?.id ?? null,
    );
  }, []);

  const handleCanvasSelection = useCallback((selection: AnimFlowElementSelection) => {
    setEditorRange(undefined);
    setSelectedElementIds((current) => {
      if (!selection.additive) return [selection.id];
      return current.includes(selection.id)
        ? current.filter((id) => id !== selection.id)
        : [...current, selection.id];
    });
    void clientRef.current?.select(selection.id).then(setAuthoring);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedElementIds([]);
    setEditorRange(undefined);
    void clientRef.current?.select(undefined).then(setAuthoring);
  }, []);

  const selectScene = useCallback((scene: CompiledScene) => {
    setEditorRange(undefined);
    setActiveSceneId(scene.id);
    setSeekRequest((current) => ({ requestId: (current?.requestId ?? 0) + 1, timeMs: scene.startMs }));
    void clientRef.current?.select(scene.id).then(setAuthoring);
  }, []);

  const selectedElements = useMemo(
    () => plan?.elements.filter((element) => selectedElementIds.includes(element.id)) ?? [],
    [plan, selectedElementIds],
  );
  const activeScene = plan?.scenes.find((scene) => scene.id === activeSceneId) ?? plan?.scenes[0];
  const draftPending = authoring ? sourceDraft !== authoring.source : false;
  const editingBlocked = busy || stale || draftPending || writerLease.status !== "writer" || !authoring;

  const addAction = useCallback(async (tool: ActionTool) => {
    if (!authoring || !activeScene || selectedElements.length === 0) return;
    const used = new Set(plan?.authoring?.actions.map((action) => String(action.id)) ?? []);
    const actionId = nextId(used, `${activeScene.id}_${tool}`);
    const action = actionForTool(tool, selectedElements, used, actionId);
    if (!action) {
      setNotice("Trace needs one selected edge. Choose an edge on the canvas.");
      return;
    }
    await applyCommand({
      type: "action.add",
      baseRevision: authoring.documentRevision,
      sceneId: activeScene.id,
      actionId,
      action,
    });
  }, [activeScene, applyCommand, authoring, plan?.authoring?.actions, selectedElements]);

  const setSceneNarration = useCallback(async () => {
    if (!authoring || !activeScene) return;
    if (await applyCommand({
      type: "narration.set",
      baseRevision: authoring.documentRevision,
      sceneId: activeScene.id,
      text: narration.trim() || null,
    })) setNarration("");
  }, [activeScene, applyCommand, authoring, narration]);

  const addScene = useCallback(async () => {
    if (!authoring || !plan) return;
    const used = new Set(plan.scenes.map((scene) => String(scene.id)));
    const sceneId = nextId(used, "newCue");
    if (await applyCommand({
      type: "scene.add",
      baseRevision: authoring.documentRevision,
      sceneId,
      title: "New cue",
      duration: { value: 2, unit: "s" },
    })) {
      const next = plan.scenes.length;
      setSeekRequest((current) => ({ requestId: (current?.requestId ?? 0) + 1, timeMs: plan.durationMs }));
      setNotice(`Scene ${next + 1} added.`);
    }
  }, [applyCommand, authoring, plan]);

  const moveScene = useCallback(async (scene: CompiledScene, delta: number) => {
    if (!authoring || !plan) return;
    const current = plan.scenes.findIndex((candidate) => candidate.id === scene.id);
    const index = current + delta;
    if (index < 0 || index >= plan.scenes.length) return;
    await applyCommand({
      type: "scene.move",
      baseRevision: authoring.documentRevision,
      sceneId: scene.id,
      index,
    });
  }, [applyCommand, authoring, plan]);

  const removeScene = useCallback(async (scene: CompiledScene) => {
    if (!authoring || !plan || plan.scenes.length <= 1) return;
    await applyCommand({
      type: "scene.remove",
      baseRevision: authoring.documentRevision,
      sceneId: scene.id,
    });
  }, [applyCommand, authoring, plan]);

  const history = useCallback(async (direction: "undo" | "redo") => {
    const client = clientRef.current;
    if (!client || !authoring) return;
    setBusy(true);
    try {
      const response = direction === "undo"
        ? await client.undo({ baseRevision: authoring.documentRevision })
        : await client.redo({ baseRevision: authoring.documentRevision });
      setAuthoring(response.state);
      if (response.result?.status !== "rejected") setSourceDraft(response.state.source);
      setNotice(direction === "undo" ? "Undid the last edit." : "Redid the edit.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }, [authoring]);

  const importMermaid = useCallback(async (mermaid: string) => {
    const client = clientRef.current;
    if (!client) return;
    setBusy(true);
    try {
      const response = await client.importMermaid(mermaid);
      setAuthoring(response.state);
      setSourceDraft(response.state.source);
      setSelectedElementIds([]);
      setImportOpen(false);
      setNotice("Mermaid flowchart imported as editable AnimFlow 2.1.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }, []);

  const importFile = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    void file.text()
      .then(async (text) => {
        if (/\.(mmd|mermaid)$/i.test(file.name)) await importMermaid(text);
        else if (authoring) {
          await applyCommand({
            type: "source.replace",
            baseRevision: authoring.documentRevision,
            source: text,
          });
        }
      })
      .catch((error: unknown) => setNotice(error instanceof Error ? error.message : String(error)))
      .finally(() => { input.value = ""; });
  }, [applyCommand, authoring, importMermaid]);

  const openDocument = useCallback((nextDocumentId: string) => {
    setLibraryOpen(false);
    if (nextDocumentId === documentId) return;
    localStorage.setItem("animflow-studio-document", nextDocumentId);
    setAuthoring(null);
    setPlan(null);
    setSelectedElementIds([]);
    setActiveSceneId(null);
    setRecovered(false);
    setSourceOpen(false);
    setNotice("Opening your local lesson…");
    setDocumentId(nextDocumentId);
  }, [documentId]);

  const createProject = useCallback(async (nextTitle: string, source: string) => {
    setLibraryBusy(true);
    try {
      const nextDocumentId = `${slug(nextTitle) || "lesson"}-${Date.now().toString(36)}`;
      await saveStudioDraft({
        documentId: nextDocumentId,
        title: nextTitle,
        currentRevision: 0,
        source,
        updatedAt: Date.now(),
      });
      openDocument(nextDocumentId);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    } finally {
      setLibraryBusy(false);
    }
  }, [openDocument]);

  const duplicateProject = useCallback(async (sourceDocumentId: string) => {
    setLibraryBusy(true);
    try {
      const draft = sourceDocumentId === documentId && authoring
        ? { documentId, title, currentRevision: authoring.documentRevision, source: authoring.source, updatedAt: Date.now() }
        : await loadStudioDraft(sourceDocumentId);
      if (!draft) throw new Error("That local project no longer exists.");
      const nextDocumentId = `lesson-${Date.now().toString(36)}`;
      const nextTitle = `${draft.title} — copy`;
      await saveStudioDraft({ ...draft, documentId: nextDocumentId, title: nextTitle, updatedAt: Date.now() });
      openDocument(nextDocumentId);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    } finally {
      setLibraryBusy(false);
    }
  }, [authoring, documentId, openDocument, title]);

  const deleteProject = useCallback(async (targetDocumentId: string) => {
    setLibraryBusy(true);
    try {
      await deleteStudioDraft(targetDocumentId);
      const remaining = await listStudioDocuments();
      setDocuments(remaining);
      if (targetDocumentId === documentId) {
        if (remaining[0]) openDocument(remaining[0].documentId);
        else await createProject("Untitled lesson", BLANK_STUDIO_SOURCE);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    } finally {
      setLibraryBusy(false);
    }
  }, [createProject, documentId, openDocument]);

  const saveAsCopy = useCallback(async () => {
    const nextId = `lesson-${Date.now().toString(36)}`;
    const nextTitle = `${title} — copy`;
    await saveStudioDraft({
      documentId: nextId,
      title: nextTitle,
      currentRevision: authoring?.documentRevision ?? 0,
      source: authoring?.source ?? sourceDraft,
      updatedAt: Date.now(),
    });
    localStorage.setItem("animflow-studio-document", nextId);
    setTitle(nextTitle);
    setDocumentId(nextId);
    setNotice("Opened an independent local copy.");
  }, [authoring, sourceDraft, title]);

  const exportSource = useCallback(() => {
    const blob = new Blob([sourceDraft], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slug(title) || "lesson"}.animflow`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [sourceDraft, title]);

  const handleSourceChange = useCallback((source: string) => {
    setEditorRange(undefined);
    setSourceDraft(source);
  }, []);

  const openPresenter = useCallback(async () => {
    if (!authoring) return;
    await saveStudioDraft({ documentId, title, currentRevision: authoring.documentRevision, source: authoring.source, updatedAt: Date.now() });
    window.open("/present", "_blank", "noopener,noreferrer");
  }, [authoring, documentId, title]);

  const publishRevision = useCallback(async () => {
    if (!authoring) return;
    setPublishDialog({ status: "publishing" });
    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: authoring.source, title, documentId }),
      });
      const body = await response.json() as { readonly url?: string; readonly deletionToken?: string; readonly expiresAt?: string; readonly integrityHash?: string; readonly error?: { readonly message?: string } };
      if (!response.ok || !body.url || !body.deletionToken || !body.expiresAt || !body.integrityHash) throw new Error(body.error?.message ?? "Publishing failed.");
      setPublishDialog({ status: "published", url: new URL(body.url, window.location.origin).toString(), deletionToken: body.deletionToken, expiresAt: body.expiresAt, integrityHash: body.integrityHash });
    } catch (error) {
      setPublishDialog({ status: "error", message: error instanceof Error ? error.message : String(error) });
    }
  }, [authoring, documentId, title]);

  const errors = previewDiagnostics.filter((diagnostic) => diagnostic.severity === "error");
  const activeRange: SourceRange | undefined = editorRange ?? sourceSelection;
  const presentationBlocked = errors.length > 0 || stale || draftPending || !authoring;

  return (
    <main className="studio-shell">
      <header className="studio-topbar">
        <div className="studio-brand" aria-label="AnimFlow Studio">
          <span className="studio-brand-mark">AF</span>
          <span><strong>AnimFlow</strong><small>lecture studio</small></span>
        </div>
        <label className="studio-title-field">
          <span>Lesson title</span>
          <input disabled={writerLease.status !== "writer"} onChange={(event) => setTitle(event.target.value)} value={title} />
        </label>
        <div className="studio-status" data-state={!authoring ? "opening" : errors.length ? "error" : stale ? "stale" : "ready"}>
          <span className="studio-status-dot" />
          {!authoring ? "Opening lesson" : errors.length ? `${errors.length} blocking` : stale ? "Stale preview" : "Ready to teach"}
        </div>
        <div className="studio-top-actions">
          <button disabled={!authoring?.canUndo || busy} onClick={() => void history("undo")} type="button" aria-label="Undo">↶</button>
          <button disabled={!authoring?.canRedo || busy} onClick={() => void history("redo")} type="button" aria-label="Redo">↷</button>
          <button className="studio-mobile-action" onClick={() => setLibraryOpen(true)} type="button">Projects</button>
          <button className="studio-primary-action" disabled={presentationBlocked} onClick={() => void openPresenter()} type="button">Present</button>
          <button className="studio-publish-action" disabled={presentationBlocked} onClick={() => void publishRevision()} type="button">Publish</button>
          <button className="studio-mobile-action" onClick={() => setSourceOpen((open) => !open)} type="button">Source</button>
          <button className="studio-mobile-action" onClick={() => setHelpOpen(true)} type="button">Help</button>
          <label aria-disabled={!authoring} className="studio-file-button">Open file<input accept=".animflow,.mmd,.mermaid,text/plain" disabled={!authoring} onChange={importFile} type="file" /></label>
          <button className="studio-import-action" disabled={!authoring} onClick={() => setImportOpen(true)} type="button">Import Mermaid</button>
          <button className="studio-export-action" onClick={exportSource} type="button">Export</button>
          <Link className="studio-legacy-link" href="/legacy">v1</Link>
        </div>
      </header>

      {writerLease.status === "conflict" ? (
        <div className="studio-conflict" role="alert">
          <span>Another tab is editing this lesson. This tab is read-only to prevent an overwrite.</span>
          <button onClick={() => void saveAsCopy()} type="button">Save as copy</button>
          <button onClick={writerLease.takeOver} type="button">Take over editing</button>
        </div>
      ) : null}
      {storageError ? <div className="studio-storage-error" role="alert">{storageError}<button onClick={exportSource} type="button">Export source</button></div> : null}

      <div className="studio-workspace">
        <aside className="studio-toolrail" aria-label="Workspace tools">
          <button className="is-active" type="button"><ToolGlyph label="Canvas" glyph="◇" /></button>
          <button onClick={() => setLibraryOpen(true)} type="button"><ToolGlyph label="Projects" glyph="▦" /></button>
          <button onClick={() => setSourceOpen((open) => !open)} type="button"><ToolGlyph label="Source" glyph="⌁" /></button>
          <span className="studio-toolrail-spacer" />
          <button onClick={() => setHelpOpen(true)} type="button"><ToolGlyph label="Help" glyph="?" /></button>
        </aside>

        <section className="studio-stage" aria-label="Lecture canvas">
          <div className="studio-stage-head">
            <div><span>Canvas</span><strong>{activeScene?.title ?? "Initial state"}</strong></div>
            <div className="studio-stage-meta">
              <span>{plan?.elements.length ?? 0} elements</span>
              <span>{Math.round((activeScene?.durationMs ?? 0) / 100) / 10}s cue</span>
              <button onClick={clearSelection} type="button">Clear selection</button>
            </div>
          </div>
          <div className="studio-canvas-wrap">
            <V2Player
              onDiagnostics={setPreviewDiagnostics}
              onElementSelect={handleCanvasSelection}
              onPlan={handlePlan}
              onSceneChange={setActiveSceneId}
              onSelectionClear={clearSelection}
              onStaleChange={setStale}
              seekRequest={seekRequest}
              selectedElementIds={selectedElementIds}
              source={sourceDraft}
            />
          </div>
          <div className="studio-notice" role="status">
            <span>{notice}</span>
            <span>{saveState === "saving" ? "Saving…" : saveState === "saved" ? `Local r${authoring?.documentRevision ?? 0}` : recovered ? "Recovered" : "Local-first"}</span>
          </div>
        </section>

        <Inspector
          activeScene={activeScene}
          blocked={editingBlocked}
          narration={narration}
          onAction={(tool) => void addAction(tool)}
          onNarrationChange={setNarration}
          onNarrationSave={() => void setSceneNarration()}
          selected={selectedElements}
          stale={stale}
        />
      </div>

      <SceneRail
        activeSceneId={activeScene?.id ?? null}
        blocked={editingBlocked}
        onAdd={() => void addScene()}
        onMove={(scene, delta) => void moveScene(scene, delta)}
        onRemove={(scene) => void removeScene(scene)}
        onSelect={selectScene}
        plan={plan}
      />

      {sourceOpen ? (
        <section className="studio-source-drawer" aria-label="AnimFlow source">
          <div className="studio-drawer-head">
            <div><span>Native source</span><strong>lesson.animflow</strong></div>
            <div>
              <span>{draftPending ? "Checking draft…" : `${sourceDraft.split("\n").length} lines`}</span>
              <button onClick={() => setSourceOpen(false)} type="button">Close</button>
            </div>
          </div>
          <div className="studio-source-grid">
            <DslEditor
              diagnostics={previewDiagnostics}
              onChange={handleSourceChange}
              readOnly={writerLease.status !== "writer"}
              selectionRange={activeRange}
              value={sourceDraft}
            />
            <div className="studio-diagnostics" aria-label="Diagnostics">
              <h3>Diagnostics</h3>
              {previewDiagnostics.length === 0 ? <p>No compiler diagnostics.</p> : previewDiagnostics.map((diagnostic, index) => (
                <button
                  key={`${diagnostic.code}-${diagnostic.range.start.offset}-${index}`}
                  onClick={() => setEditorRange({
                    end: { ...diagnostic.range.end },
                    start: { ...diagnostic.range.start },
                  })}
                  type="button"
                >
                  <span data-severity={diagnostic.severity}>{diagnostic.code}</span>
                  <strong>Line {diagnostic.range.start.line + 1}</strong>
                  <small>{diagnostic.message}</small>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {importOpen ? <MermaidImportDialog busy={busy} onClose={() => setImportOpen(false)} onImport={importMermaid} /> : null}
      {libraryOpen ? (
        <ProjectLibraryDialog
          activeDocumentId={documentId}
          busy={libraryBusy}
          documents={documents}
          examples={STUDIO_EXAMPLES}
          onClose={() => setLibraryOpen(false)}
          onCreate={() => void createProject("Untitled lesson", BLANK_STUDIO_SOURCE)}
          onDelete={(targetDocumentId) => void deleteProject(targetDocumentId)}
          onDuplicate={(targetDocumentId) => void duplicateProject(targetDocumentId)}
          onOpen={openDocument}
          onUseExample={(example) => void createProject(example.title, example.source)}
        />
      ) : null}
      {helpOpen ? <HelpDialog onClose={() => setHelpOpen(false)} /> : null}
      {publishDialog ? <PublishDialog onClose={() => setPublishDialog(null)} state={publishDialog} /> : null}
    </main>
  );
}

function ProjectLibraryDialog({
  activeDocumentId,
  busy,
  documents,
  examples,
  onClose,
  onCreate,
  onDelete,
  onDuplicate,
  onOpen,
  onUseExample,
}: {
  readonly activeDocumentId: string;
  readonly busy: boolean;
  readonly documents: readonly StudioDocumentMetadata[];
  readonly examples: readonly StudioExample[];
  readonly onClose: () => void;
  readonly onCreate: () => void;
  readonly onDelete: (documentId: string) => void;
  readonly onDuplicate: (documentId: string) => void;
  readonly onOpen: (documentId: string) => void;
  readonly onUseExample: (example: StudioExample) => void;
}) {
  const [deleteCandidate, setDeleteCandidate] = useState<string>();
  return (
    <div className="studio-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div aria-labelledby="project-library-title" aria-modal="true" className="studio-modal studio-library-modal" role="dialog">
        <div className="studio-modal-head">
          <div><span>Local project shelf</span><h2 id="project-library-title">Choose the lesson to direct</h2></div>
          <button aria-label="Close project library" onClick={onClose} type="button">×</button>
        </div>
        <p className="studio-library-intro">Every project stays in this browser until you publish. Start clean, resume a lesson, or copy an example into your own workspace.</p>

        <section className="studio-library-section" aria-labelledby="my-lessons-title">
          <div className="studio-library-section-head">
            <div><span>{String(documents.length).padStart(2, "0")}</span><h3 id="my-lessons-title">My lessons</h3></div>
            <button disabled={busy} onClick={onCreate} type="button">＋ New project</button>
          </div>
          {documents.length ? (
            <div className="studio-project-grid">
              {documents.map((document) => {
                const active = document.documentId === activeDocumentId;
                const confirmingDelete = deleteCandidate === document.documentId;
                return (
                  <article className={active ? "studio-project-card is-current" : "studio-project-card"} key={document.documentId}>
                    <div className="studio-project-card-top"><span>{active ? "Current" : "Local draft"}</span><time dateTime={new Date(document.updatedAt).toISOString()}>{formatUpdatedAt(document.updatedAt)}</time></div>
                    <button className="studio-project-open" disabled={busy || active} onClick={() => onOpen(document.documentId)} type="button">
                      <strong>{document.title}</strong>
                      <small>Revision {document.currentRevision}</small>
                    </button>
                    <div className="studio-project-actions">
                      <button disabled={busy} onClick={() => onDuplicate(document.documentId)} type="button">Duplicate</button>
                      <button className={confirmingDelete ? "is-confirming" : ""} disabled={busy} onClick={() => {
                        if (confirmingDelete) onDelete(document.documentId);
                        else setDeleteCandidate(document.documentId);
                      }} type="button">{confirmingDelete ? "Confirm delete" : "Delete"}</button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <p className="studio-library-empty">No saved lessons yet. Start a blank project or use an example below.</p>}
        </section>

        <section className="studio-library-section studio-example-library" aria-labelledby="examples-title">
          <div className="studio-library-section-head">
            <div><span>03</span><h3 id="examples-title">Start from an example</h3></div>
            <small>Each example becomes an independent local project.</small>
          </div>
          <div className="studio-example-grid">
            {examples.map((example, index) => (
              <article className="studio-example-card" key={example.id}>
                <div className="studio-example-signal" data-variant={index + 1} aria-hidden="true"><i /><span /><span /><span /></div>
                <span>{example.category}</span>
                <strong>{example.title}</strong>
                <p>{example.description}</p>
                <button disabled={busy} onClick={() => onUseExample(example)} type="button">Use example</button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function HelpDialog({ onClose }: { readonly onClose: () => void }) {
  return (
    <div className="studio-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div aria-labelledby="help-dialog-title" aria-modal="true" className="studio-modal studio-help-modal" role="dialog">
        <div className="studio-modal-head">
          <div><span>Three-step workflow</span><h2 id="help-dialog-title">Build the lesson, then teach it</h2></div>
          <button aria-label="Close help dialog" onClick={onClose} type="button">×</button>
        </div>
        <div className="studio-help-steps">
          <article><span>01</span><strong>Shape the diagram</strong><p>Open AnimFlow source or import a Mermaid flowchart. Source stays local until you publish.</p></article>
          <article><span>02</span><strong>Direct each cue</strong><p>Select a node, edge, or note on the canvas. Add reveal, focus, trace, hide, camera, and narration actions.</p></article>
          <article><span>03</span><strong>Teach or share</strong><p>Present opens the local lesson in speaker mode. Publish creates an immutable public revision.</p></article>
        </div>
        <div className="studio-help-shortcuts" aria-label="Keyboard shortcuts">
          <span><kbd>Space</kbd> Play or pause</span>
          <span><kbd>←</kbd><kbd>→</kbd> Move between cues</span>
          <span><kbd>Shift</kbd> Select several elements</span>
        </div>
        <div className="studio-modal-actions"><button onClick={onClose} type="button">Back to canvas</button></div>
      </div>
    </div>
  );
}

function PublishDialog({ onClose, state }: { readonly onClose: () => void; readonly state: PublishDialogState }) {
  return (
    <div className="studio-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && state.status !== "publishing") onClose(); }}>
      <div aria-labelledby="publish-dialog-title" aria-modal="true" className="studio-modal publish-modal" role="dialog">
        <div className="studio-modal-head"><div><span>Immutable revision</span><h2 id="publish-dialog-title">{state.status === "publishing" ? "Publishing…" : state.status === "error" ? "Publish stopped" : "Your lesson is public"}</h2></div>{state.status !== "publishing" ? <button aria-label="Close publish dialog" onClick={onClose} type="button">×</button> : null}</div>
        {state.status === "publishing" ? <p>The server is formatting and compiling this revision in an isolated worker.</p> : null}
        {state.status === "error" ? <><p role="alert">{state.message}</p><div className="studio-modal-actions"><button onClick={onClose} type="button">Close</button></div></> : null}
        {state.status === "published" ? <>
          <p>This URL points to the compiled revision below. Later Studio edits cannot change it.</p>
          <label>Public URL<input readOnly value={state.url} /></label>
          <label>Deletion token<input readOnly value={state.deletionToken} /></label>
          <p className="publish-token-warning">Save the deletion token now. The server stores only its hash and cannot show it again.</p>
          <dl><div><dt>Expires</dt><dd>{new Date(state.expiresAt).toLocaleString()}</dd></div><div><dt>SHA-256</dt><dd><code>{state.integrityHash}</code></dd></div></dl>
          <div className="studio-modal-actions"><button onClick={() => void navigator.clipboard.writeText(`${state.url}\nDeletion token: ${state.deletionToken}`)} type="button">Copy receipt</button><a href={state.url} rel="noreferrer" target="_blank">Open public lesson</a></div>
        </> : null}
      </div>
    </div>
  );
}

function Inspector({
  activeScene,
  blocked,
  narration,
  onAction,
  onNarrationChange,
  onNarrationSave,
  selected,
  stale,
}: {
  readonly activeScene?: CompiledScene;
  readonly blocked: boolean;
  readonly narration: string;
  readonly onAction: (tool: ActionTool) => void;
  readonly onNarrationChange: (value: string) => void;
  readonly onNarrationSave: () => void;
  readonly selected: readonly CompiledElement[];
  readonly stale: boolean;
}) {
  const one = selected.length === 1 ? selected[0] : undefined;
  return (
    <aside className="studio-inspector" aria-label="Action inspector">
      <div className="studio-inspector-head"><span>Inspector</span><small>{activeScene?.id ?? "no scene"}</small></div>
      <div className="studio-selection-card">
        <span className="studio-kind-chip">{selected.length > 1 ? "GROUP" : one?.kind.toUpperCase() ?? "SELECT"}</span>
        <strong>{selected.length > 1 ? `${selected.length} elements` : one ? elementName(one) : "Choose an element"}</strong>
        <p>{one ? String(one.id) : "Click a node, edge, or note on the canvas. Shift-click selects several."}</p>
      </div>
      {stale ? <div className="studio-stale-lock">Fix source errors before adding actions. You can still seek the last valid preview.</div> : null}
      <section className="studio-inspector-section">
        <div className="studio-section-label"><span>Add action</span><small>{activeScene?.title}</small></div>
        <div className="studio-action-grid">
          <ActionButton disabled={blocked || selected.length === 0} glyph="↗" label="Reveal" onClick={() => onAction("reveal")} />
          <ActionButton disabled={blocked || selected.length === 0} glyph="◎" label="Focus" onClick={() => onAction("focus")} />
          <ActionButton disabled={blocked || selected.length !== 1 || one?.kind !== "edge"} glyph="⟿" label="Trace" onClick={() => onAction("trace")} />
          <ActionButton disabled={blocked || selected.length === 0} glyph="◌" label="Hide" onClick={() => onAction("hide")} />
          <ActionButton disabled={blocked || selected.length === 0} glyph="⌗" label="Camera" onClick={() => onAction("camera")} />
        </div>
      </section>
      <section className="studio-inspector-section studio-narration">
        <div className="studio-section-label"><span>Narration</span><small>speaker cue</small></div>
        <textarea disabled={blocked} onChange={(event) => onNarrationChange(event.target.value)} placeholder="What should the audience understand in this cue?" value={narration} />
        <button disabled={blocked} onClick={onNarrationSave} type="button">Set narration</button>
      </section>
      <section className="studio-inspector-section studio-shortcuts">
        <div className="studio-section-label"><span>Selection</span><small>source-linked</small></div>
        <dl><div><dt>Scene</dt><dd>{activeScene?.title ?? "—"}</dd></div><div><dt>Target</dt><dd>{one ? String(one.id) : selected.length ? `${selected.length} selected` : "—"}</dd></div></dl>
      </section>
    </aside>
  );
}

function SceneRail({ activeSceneId, blocked, onAdd, onMove, onRemove, onSelect, plan }: {
  readonly activeSceneId: string | null;
  readonly blocked: boolean;
  readonly onAdd: () => void;
  readonly onMove: (scene: CompiledScene, delta: number) => void;
  readonly onRemove: (scene: CompiledScene) => void;
  readonly onSelect: (scene: CompiledScene) => void;
  readonly plan: RenderPlan | null;
}) {
  return (
    <section className="studio-cue-rail" aria-label="Scene cue rail">
      <div className="studio-rail-label"><span>Scene cues</span><small>{plan?.scenes.length ?? 0} in lesson</small></div>
      <div className="studio-scene-list">
        {plan?.scenes.map((scene, index) => (
          <article className={scene.id === activeSceneId ? "studio-scene-card is-active" : "studio-scene-card"} key={scene.id}>
            <button className="studio-scene-main" onClick={() => onSelect(scene)} type="button">
              <span className="studio-scene-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="studio-scene-thumb"><SceneThumbnail plan={plan} scene={scene} /></span>
              <span className="studio-scene-copy"><strong>{scene.title}</strong><small>{formatDuration(scene.durationMs)} · {scene.tracks.length} tracks</small></span>
            </button>
            <div className="studio-scene-controls">
              <button aria-label={`Move ${scene.title} earlier`} disabled={blocked || index === 0} onClick={() => onMove(scene, -1)} type="button">←</button>
              <button aria-label={`Move ${scene.title} later`} disabled={blocked || index === plan.scenes.length - 1} onClick={() => onMove(scene, 1)} type="button">→</button>
              <button aria-label={`Delete ${scene.title}`} disabled={blocked || plan.scenes.length <= 1} onClick={() => onRemove(scene)} type="button">×</button>
            </div>
          </article>
        ))}
        <button className="studio-add-scene" disabled={blocked} onClick={onAdd} type="button"><span>＋</span>Add cue</button>
      </div>
    </section>
  );
}

function SceneThumbnail({ plan, scene }: { readonly plan: RenderPlan; readonly scene: CompiledScene }) {
  const frame: FrameState = {
    ...scene.to,
    timeMs: scene.startMs + scene.durationMs,
    sceneId: scene.id,
    progress: 1,
  };
  return <AnimFlowCanvas ariaLabel={`${scene.title} thumbnail`} frame={frame} plan={plan} />;
}

function MermaidImportDialog({ busy, onClose, onImport }: { readonly busy: boolean; readonly onClose: () => void; readonly onImport: (source: string) => Promise<void> }) {
  const [source, setSource] = useState("flowchart LR\n  Client --> API\n  API --> Database");
  return (
    <div className="studio-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div aria-labelledby="mermaid-dialog-title" aria-modal="true" className="studio-modal" role="dialog">
        <div className="studio-modal-head"><div><span>Strict importer</span><h2 id="mermaid-dialog-title">Bring in a Mermaid flowchart</h2></div><button aria-label="Close import dialog" onClick={onClose} type="button">×</button></div>
        <p>Flowchart nodes, directed edges, labels, and basic shapes become stable AnimFlow IDs. Unsupported Mermaid features are reported instead of approximated.</p>
        <textarea aria-label="Mermaid source" onChange={(event) => setSource(event.target.value)} spellCheck={false} value={source} />
        <div className="studio-modal-actions"><button onClick={onClose} type="button">Cancel</button><button disabled={busy || !source.trim()} onClick={() => void onImport(source)} type="button">Import flowchart</button></div>
      </div>
    </div>
  );
}

function ActionButton({ disabled, glyph, label, onClick }: { readonly disabled: boolean; readonly glyph: string; readonly label: string; readonly onClick: () => void }) {
  return <button disabled={disabled} onClick={onClick} type="button"><span>{glyph}</span><strong>{label}</strong></button>;
}

function ToolGlyph({ glyph, label }: { readonly glyph: string; readonly label: string }) {
  return <><span aria-hidden="true">{glyph}</span><small>{label}</small></>;
}

function actionForTool(
  tool: ActionTool,
  elements: readonly CompiledElement[],
  used: Set<string>,
  parentId: string,
): ActionDraft | undefined {
  const targets = elements.length === 1
    ? { kind: "named" as const, target: String(elements[0]!.id) }
    : { kind: "list" as const, elements: elements.map((element) => String(element.id)) as [string, ...string[]] };
  if (tool === "reveal" || tool === "hide") {
    return { kind: tool === "reveal" ? "show" : "hide", targets, transition: { kind: "fade" } };
  }
  if (tool === "camera") return { kind: "camera", operation: "focus", targets, padding: 72 };
  if (tool === "trace") {
    const edge = elements.length === 1 && elements[0]?.kind === "edge" ? elements[0] : undefined;
    return edge ? { kind: "draw", edge: String(edge.id), flow: "particles" } : undefined;
  }
  if (elements.length === 1) {
    return { kind: "highlight", target: String(elements[0]!.id), tone: "accent", effect: "pulse" };
  }
  return {
    kind: "sequence",
    statements: elements.map((element, index) => ({
      kind: "action" as const,
      actionId: nextId(used, `${parentId}_focus${index + 1}`),
      action: { kind: "highlight" as const, target: String(element.id), tone: "accent", effect: "pulse" as const },
    })),
  };
}

function nextId(used: Set<string>, stem: string): string {
  let candidate = stem.replace(/[^_a-zA-Z0-9]/g, "_");
  if (!/^[_a-zA-Z]/.test(candidate)) candidate = `cue_${candidate}`;
  let index = 2;
  while (used.has(candidate)) candidate = `${stem}_${index++}`;
  used.add(candidate);
  return candidate;
}

function elementName(element: CompiledElement): string {
  if (element.kind === "node") return element.label;
  if (element.kind === "edge") return element.label ?? `${element.from.nodeId} → ${element.to.nodeId}`;
  return element.text;
}

function formatDuration(durationMs: number): string {
  return `${Math.round(durationMs / 100) / 10}s`;
}

function formatUpdatedAt(updatedAt: number): string {
  const elapsed = Math.max(0, Date.now() - updatedAt);
  if (elapsed < 60_000) return "just now";
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m ago`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h ago`;
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(updatedAt);
}

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "");
}
