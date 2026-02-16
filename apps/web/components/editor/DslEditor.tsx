"use client";

import React from "react";
import Editor from "@monaco-editor/react";

interface DslEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function DslEditor({ value, onChange }: DslEditorProps) {
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || "");
  };

  return (
    <Editor
      height="100%"
      defaultLanguage="yaml"
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
