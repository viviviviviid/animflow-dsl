"use client";

import { useEffect, useRef } from "react";
import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import { animFlowMonarch } from "@animflow-dsl/language";
import type { Diagnostic } from "@animflow-dsl/model";

interface DslEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: "animflow" | "plaintext";
  diagnostics?: readonly Diagnostic[];
}

export function DslEditor({
  value,
  onChange,
  language = "animflow",
  diagnostics = [],
}: DslEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
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
  }, [diagnostics, language]);

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
      }}
    />
  );
}
