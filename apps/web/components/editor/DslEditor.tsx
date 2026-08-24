"use client";

import { useEffect, useRef, useState } from "react";
import Editor, { loader, type Monaco, type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import { animFlowMonarch } from "@animflow-dsl/language";
import type {
  AnimFlowCompletion,
  AnimFlowDefinition,
  AnimFlowHover,
} from "@animflow-dsl/language";
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
  theme?: "dark" | "light";
  diagnostics?: readonly Diagnostic[];
  selectionRange?: SourceRange;
  readOnly?: boolean;
  complete?: (
    source: string,
    position: { readonly line: number; readonly character: number },
  ) => Promise<readonly AnimFlowCompletion[]>;
  define?: (
    source: string,
    position: { readonly line: number; readonly character: number },
  ) => Promise<readonly AnimFlowDefinition[]>;
  hover?: (
    source: string,
    position: { readonly line: number; readonly character: number },
  ) => Promise<AnimFlowHover | undefined>;
}

export function DslEditor({
  value,
  onChange,
  language = "animflow",
  theme = "dark",
  diagnostics = [],
  selectionRange,
  readOnly = false,
  complete,
  define,
  hover,
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
    const monaco = monacoRef.current;
    const model = editor?.getModel();
    if (!editor || !monaco || !model || language !== "animflow" || readOnly) return;
    const disposable = monaco.languages.registerCodeActionProvider("animflow", {
      provideCodeActions(
        currentModel: monaco.editor.ITextModel,
        range: monaco.Range,
        context: monaco.languages.CodeActionContext,
      ) {
        if (currentModel !== model) return { actions: [], dispose: () => undefined };
        const actions = diagnostics.flatMap((diagnostic) => {
          if (!diagnostic.fixes || !intersects(range, diagnostic.range)) return [];
          const marker = context.markers.find((candidate) =>
            String(candidate.code) === diagnostic.code &&
            candidate.startLineNumber === diagnostic.range.start.line + 1 &&
            candidate.startColumn === diagnostic.range.start.character + 1
          );
          return diagnostic.fixes.map((fix, index) => ({
            title: fix.title,
            kind: "quickfix",
            diagnostics: marker ? [marker] : undefined,
            isPreferred: index === 0,
            edit: {
              edits: fix.edits.map((edit) => ({
                resource: model.uri,
                textEdit: {
                  range: toMonacoRange(edit.range),
                  text: edit.newText,
                },
                versionId: model.getVersionId(),
              })),
            },
          }));
        });
        return { actions, dispose: () => undefined };
      },
    });
    return () => disposable.dispose();
  }, [diagnostics, editorReady, language, readOnly]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();
    if (!editor || !monaco || !model || language !== "animflow") return;
    const disposables = [
      complete
        ? monaco.languages.registerCompletionItemProvider("animflow", {
            triggerCharacters: ["."],
            async provideCompletionItems(
              currentModel: monaco.editor.ITextModel,
              position: monaco.Position,
              _context: monaco.languages.CompletionContext,
              token: monaco.CancellationToken,
            ) {
              if (currentModel !== model) return { suggestions: [] };
              const items = await complete(currentModel.getValue(), fromMonacoPosition(position));
              if (token.isCancellationRequested) return { suggestions: [] };
              return {
                suggestions: items.map((item) => ({
                  label: item.label,
                  insertText: item.insertText,
                  kind: item.kind as monaco.languages.CompletionItemKind | undefined
                    ?? monaco.languages.CompletionItemKind.Text,
                  range: item.replaceRange ? toMonacoRange(item.replaceRange) : undefined,
                  ...(item.detail ? { detail: item.detail } : {}),
                  ...(item.documentation
                    ? { documentation: { value: item.documentation } }
                    : {}),
                })),
              };
            },
          })
        : undefined,
      define
        ? monaco.languages.registerDefinitionProvider("animflow", {
            async provideDefinition(
              currentModel: monaco.editor.ITextModel,
              position: monaco.Position,
              token: monaco.CancellationToken,
            ) {
              if (currentModel !== model) return [];
              const definitions = await define(currentModel.getValue(), fromMonacoPosition(position));
              if (token.isCancellationRequested) return [];
              return definitions.map((definition) => ({
                uri: model.uri,
                range: toMonacoRange(definition.targetSelectionRange),
              }));
            },
          })
        : undefined,
      hover
        ? monaco.languages.registerHoverProvider("animflow", {
            async provideHover(
              currentModel: monaco.editor.ITextModel,
              position: monaco.Position,
              token: monaco.CancellationToken,
            ) {
              if (currentModel !== model) return undefined;
              const result = await hover(currentModel.getValue(), fromMonacoPosition(position));
              if (!result || token.isCancellationRequested) return undefined;
              return {
                contents: [{ value: result.markdown }],
                ...(result.range ? { range: toMonacoRange(result.range) } : {}),
              };
            },
          })
        : undefined,
    ].filter((item): item is monaco.IDisposable => item !== undefined);
    return () => disposables.forEach((disposable) => disposable.dispose());
  }, [complete, define, editorReady, hover, language]);

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
      theme={theme === "light" ? "vs" : "vs-dark"}
      value={value}
      onChange={handleEditorChange}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        quickSuggestions: { other: true, comments: false, strings: false },
        scrollBeyondLastLine: false,
        suggestOnTriggerCharacters: true,
        wordWrap: "on",
        automaticLayout: true,
        readOnly,
      }}
    />
  );
}

function toMonacoRange(range: SourceRange): monaco.IRange {
  return {
    startLineNumber: range.start.line + 1,
    startColumn: range.start.character + 1,
    endLineNumber: range.end.line + 1,
    endColumn: range.end.character + 1,
  };
}

function fromMonacoPosition(position: monaco.Position): { readonly line: number; readonly character: number } {
  return { line: position.lineNumber - 1, character: position.column - 1 };
}

function intersects(range: monaco.Range, sourceRange: SourceRange): boolean {
  const start = { lineNumber: sourceRange.start.line + 1, column: sourceRange.start.character + 1 };
  const end = { lineNumber: sourceRange.end.line + 1, column: sourceRange.end.character + 1 };
  return monaco.Range.areIntersectingOrTouching(
    range,
    new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
  );
}
