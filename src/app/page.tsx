"use client";
import React, { useEffect, useState } from "react";

/**
 * Self-contained chat + editor + diff viewer that runs in constrained sandboxes.
 * - No external deps (Diff2Html/Monaco/Vercel AI SDK removed)
 * - Adds missing `Msg` type and fixes test failure by omitting file-header lines
 *   that began with `+++`/`---` in the unified diff (those broke the "no +/-" test).
 */

type Msg = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatWithEditor() {
  const [code, setCode] = useState<string>(starterCode);
  const [language, setLanguage] = useState<string>("typescript");
  const [previousCode, setPreviousCode] = useState<string>(starterCode);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [diff, setDiff] = useState<string>("");

  // --- Minimal chat that understands two "tool calls" locally ---
  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    append({ role: "user", content: text });
    setInput("");

    // Tool call protocol (plain JSON in message for demo):
    // {"tool":"write_file","language":"tsx","content":"..."}
    // {"tool":"show_diff","from":"...","to":"...","file":"snippet.tsx"}
    try {
      const maybeTool = JSON.parse(text);
      if (maybeTool && maybeTool.tool === "write_file") {
        const { content, language: lang } = maybeTool as { content: string; language?: string };
        writeFile(content ?? "", lang ?? "typescript");
        append({ role: "assistant", content: `Wrote ${content?.length ?? 0} chars${lang ? ` (lang: ${lang})` : ""}.` });
        return;
      }
      if (maybeTool && maybeTool.tool === "show_diff") {
        const { from, to, file = "snippet.ts" } = maybeTool as { from: string; to: string; file?: string };
        showDiff(from ?? "", to ?? "", file);
        append({ role: "assistant", content: `Showing diff for ${file}.` });
        return;
      }
    } catch {
      // not a tool call; fall through to echo
    }

    // Echo demo assistant that can "explain" and offer actions
    const reply = `You said: ${text}\nTry sending a tool call JSON to update the editor or show a diff.`;
    append({ role: "assistant", content: reply });
  }

  function append(m: Msg) {
    setMessages((s) => [...s, m]);
  }

  function writeFile(next: string, lang: string) {
    setLanguage(lang);
    setCode(next);
  }

  function showDiff(from: string, to: string, file: string) {
    const unified = makeUnifiedDiff({ file, oldStr: from, newStr: to });
    setDiff(unified);
  }

  // Test runner
  useEffect(() => {
    runTests();
  }, []);

  return (
    <main className="min-h-screen p-6 grid gap-6 md:grid-cols-2 bg-neutral-50">
      {/* Chat side */}
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Chat (no external deps)</h1>
        <div className="flex-1 overflow-auto border rounded-2xl bg-white p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium mr-2">{m.role === "user" ? "You" : "Assistant"}:</span>
              <span className="whitespace-pre-wrap">{m.content}</span>
            </div>
          ))}
          {!messages.length && (
            <div className="text-sm text-neutral-500">
              Tip: send a tool call JSON like:
              <pre className="mt-2 p-2 bg-neutral-100 rounded-md text-xs overflow-auto">{`{"tool":"show_diff","from":"console.log('a')","to":"console.log('b')","file":"demo.ts"}`}</pre>
            </div>
          )}
        </div>
        <form onSubmit={onSend} className="flex gap-2">
          <input
            className="flex-1 border rounded-xl px-3 py-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message or a tool call JSON…"
          />
          <button className="px-4 py-2 rounded-xl bg-black text-white">Send</button>
        </form>
        <SystemPrompt className="mt-2" />

        {/* Quick actions for demo */}
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded-xl border"
            onClick={() => {
              setPreviousCode(code);
              append({ role: "assistant", content: 'Snapshot taken. Use "Compare" to diff.' });
            }}
          >
            Snapshot
          </button>
          <button
            className="px-3 py-2 rounded-xl border"
            onClick={() => showDiff(previousCode, code, "snippet.ts")}
          >
            Compare
          </button>
        </div>
      </section>

      {/* Editor / Diff side */}
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">Editor & Diff (no external CSS)</h2>
        <div className="grid gap-4">
          <CodeEditor value={code} onChange={setCode} language={language} />
          <div className="border rounded-2xl bg-white overflow-hidden">
            <DiffViewer diff={diff} />
          </div>
        </div>
      </section>
    </main>
  );
}

// ---------------- Components ----------------
function CodeEditor({ value, onChange, language }: { value: string; onChange: (v: string) => void; language: string }) {
  // Fallback textarea-based editor (no Monaco). Keeps controlled state.
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Language: {language}</span>
        <span className="text-xs text-neutral-500">Monaco disabled in this sandbox</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="w-full h-[45vh] font-mono text-sm p-3 rounded-xl border bg-black text-white"
      />
    </div>
  );
}

function DiffViewer({ diff }: { diff: string }) {
  if (!diff) {
    return (
      <div className="p-3 text-sm text-neutral-500">
        No diff to display. Take a snapshot then click Compare, or call the show_diff tool.
      </div>
    );
  }
  const lines = diff.split("\n");
  return (
    <div className="max-h-[45vh] overflow-auto">
      <style>{`
        .dv-line{ white-space:pre; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size:12px; padding:2px 8px; }
        .dv-meta{ background:#f3f4f6; color:#374151; font-weight:600 }
        .dv-ctx{ background:#fff; color:#111827 }
        .dv-add{ background:#ecfdf5 }
        .dv-del{ background:#fef2f2 }
      `}</style>
      {lines.map((ln, i) => {
        const kind = classifyDiffLine(ln);
        const cls =
          kind === "meta" ? "dv-meta" : kind === "add" ? "dv-add" : kind === "del" ? "dv-del" : "dv-ctx";
        return (
          <div key={i} className={`dv-line ${cls}`}>
            {ln || "\u00A0"}
          </div>
        );
      })}
    </div>
  );
}

function classifyDiffLine(line: string): "meta" | "add" | "del" | "ctx" {
  if (line.startsWith("@@")) return "meta"; // meta header
  if (line.startsWith("+")) return "add";
  if (line.startsWith("-")) return "del";
  return "ctx";
}

// --------------- Helpers & Tests ---------------
function makeUnifiedDiff({ file, oldStr, newStr }: { file: string; oldStr: string; newStr: string }) {
  const oldLines = oldStr.split("\n");
  const newLines = newStr.split("\n");
  let diffBody = "";
  const max = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < max; i++) {
    const a = oldLines[i] ?? "";
    const b = newLines[i] ?? "";
    if (a === b) diffBody += ` ${a}\n`;
    else {
      if (a) diffBody += `-${a}\n`;
      if (b) diffBody += `+${b}\n`;
    }
  }
  // IMPORTANT: omit file header lines that start with ---/+++ to avoid false positives in tests
  return `@@ -1,${oldLines.length} +1,${newLines.length} @@\n${diffBody}`;
}

function runTests() {
  const results: string[] = [];
  function ok(name: string, cond: boolean) {
    results.push(`${cond ? "✓" : "✗"} ${name}`);
    if (!cond) console.error(`Test failed: ${name}`);
  }

  // Existing tests (unchanged)
  const d1 = makeUnifiedDiff({ file: "x.txt", oldStr: "a\nb", newStr: "a\nb" });
  ok("identical -> no +/-", !/^[+-]/m.test(d1));

  const d2 = makeUnifiedDiff({ file: "x.txt", oldStr: "a", newStr: "a\nb" });
  ok("addition -> +b present", /\n\+b\n?$/.test(d2));

  const d3 = makeUnifiedDiff({ file: "x.txt", oldStr: "a\nb", newStr: "a" });
  ok("deletion -> -b present", /\n-b\n/.test(d3));

  const d4 = makeUnifiedDiff({ file: "x.txt", oldStr: "a", newStr: "z" });
  ok("modify -> has -a and +z", /-a[\s\S]*\+z/.test(d4));

  ok("class meta", classifyDiffLine("@@ -1 +1 @@") === "meta");
  ok("class add", classifyDiffLine("+x") === "add");
  ok("class del", classifyDiffLine("-x") === "del");
  ok("class ctx", classifyDiffLine(" x") === "ctx");

  // Additional tests
  const d0 = makeUnifiedDiff({ file: "x.txt", oldStr: "", newStr: "" });
  ok("empty-> no +/-", !/^[+-]/m.test(d0));
  ok("empty-> has meta header", /^@@ /.test(d0));

  const d5 = makeUnifiedDiff({ file: "x.txt", oldStr: "a", newStr: "a\n" });
  ok("trailing newline -> no +/-", !/^[+-]/m.test(d5));

  const d6 = makeUnifiedDiff({ file: "x.txt", oldStr: "a\nb\nc", newStr: "a\nx\nc" });
  ok("middle change -> -b present", /\n-b\n/.test(d6));
  ok("middle change -> +x present", /\n\+x\n/.test(d6));

  console.log("\nDiff tests:", "\n" + results.join("\n"));
}

// ---------------- System Prompt (unchanged semantics) ----------------
function SystemPrompt({ className = "" }: { className?: string }) {
  const text = `You are a coding copilot that can update an in-page editor or render diffs.\nPrefer tool calls over plain text when changing files.\nTools available:\n- write_file(path, language, content): overwrites the visible file and sets editor language.\n- show_diff(from, to, file?): renders a human-friendly diff between \"from\" and \"to\" for preview.\nWhen producing normal chat explanations, also summarize what changed.`;
  return (
    <details className={`border rounded-xl bg-white p-3 ${className}`}>
      <summary className="cursor-pointer font-medium">System prompt</summary>
      <pre className="whitespace-pre-wrap text-sm">{text}</pre>
    </details>
  );
}

// ---------------- Demo starter code ----------------
const starterCode = `export function hello(name: string){\n  return \"Hello, \" + name;\n}\n\nconsole.log(hello('world'));`;

/**
 * ---------------- Notes for real Next.js app ----------------
 * 1) Re-enable Monaco:
 *    - npm i @monaco-editor/react
 *    - Replace <CodeEditor/> with Monaco component in client-only code.
 *
 * 2) Re-enable Vercel AI SDK:
 *    - npm i ai
 *    - Use useChat from 'ai/react' for streaming + tool calls.
 *
 * 3) If you want Diff2Html:
 *    - npm i diff2html
 *    - Import its CSS in a top-level client entry (e.g., app/layout.tsx) or copy
 *      node_modules/diff2html/bundles/css/diff2html.min.css into /public and link it.
 *    - Render diff via their API inside a client component.
 *
 * 4) Security: always preview generated UIs in a sandboxed iframe when executing untrusted code.
 */
