"use client";

import React, { useState } from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism-tomorrow.css"; // High-contrast dark theme

export default function JsonEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 font-mono text-sm overflow-hidden min-h-[200px]">
      <Editor
        value={value}
        onValueChange={(code) => onChange(code)}
        highlight={(code) => highlight(code, languages.json, "json")}
        padding={15}
        style={{
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 14,
          minHeight: "200px",
        }}
        className="outline-none"
      />
    </div>
  );
}
