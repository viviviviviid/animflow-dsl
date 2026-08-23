"use client";

import { useEffect, useRef, useState } from "react";
import Editor, { loader, type Monaco, type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import { animFlowMonarch } from "@animflow-dsl/language";
import type { Diagnostic, SourceRange } from "@animflow-dsl/model";

const browserGlobal = globalThis as typeof globalThis & {
  MonacoEnvironment?: { getWorker: () => Worker };
};

browserGlobal.MonacoEnvironment = {
  getWorker: () => new Worker(
    new URL("monaco-editor/esm/vs/editor/editor.worker.js", import.meta.url),
    { type: "module" },
  ),
};
loader.config({ monaco });

interface DslEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: "animflow" | "plaintext";
  diagnostics?: readonly Diagnostic[];
  selectionRange?: SourceRange;
  readOnly?: boolean;
}

export function DslEditor({
  value,
  onChange,
  language = "animflow",
  diagnostics = [],
  selectionRange,
  readOnly = false,
}: DslEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || "");
  };

  const beforeMount = (monaco: Monaco) => {
    if (
      !monaco.languages
        .getLanguages()
        .some((item: { readonly id: string }) => item.id === "animflow")
    ) {
      monaco.languages.register({ id: "animflow", extensions: [".animflow"] });
      monaco.languages.setMonarchTokensProvider(
        "animflow",
        animFlowMonarch as unknown as Parameters<
          typeof monaco.languages.setMonarchTokensProvider
        >[1],
      );
    }
  };

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setEditorReady(true);
  };

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();
    if (!editor || !monaco || !model || language !== "animflow") return;
    monaco.editor.setModelMarkers(
      model,
      "animflow",
      diagnostics.map((diagnostic) => ({
        code: diagnostic.code,
        endColumn: Math.max(
          diagnostic.range.end.character + 1,
          diagnostic.range.start.character + 2,
        ),
        endLineNumber: diagnostic.range.end.line + 1,
        message: diagnostic.message,
        severity:
          diagnostic.severity === "error"
            ? monaco.MarkerSeverity.Error
            : monaco.MarkerSeverity.Warning,
        startColumn: diagnostic.range.start.character + 1,
        startLineNumber: diagnostic.range.start.line + 1,
      })),
    );
  }, [diagnostics, editorReady, language]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !selectionRange) return;
    const range = {
      startLineNumber: selectionRange.start.line + 1,
      startColumn: selectionRange.start.character + 1,
      endLineNumber: selectionRange.end.line + 1,
      endColumn: selectionRange.end.character + 1,
    };
    editor.setSelection(range);
    editor.revealRangeInCenter(range);
  }, [editorReady, selectionRange]);

  return (
    <Editor
      height="100%"
      beforeMount={beforeMount}
      language={language}
      onMount={handleMount}
      theme="vs-dark"
      value={value}
      onChange={handleEditorChange}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        wordWrap: "on",
        automaticLayout: true,
        readOnly,
      }}
    />
  );
}
