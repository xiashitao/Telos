"use client";

import { useEffect, useRef, useState } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { useResumeStore } from "@/lib/store";
import { importResumeSchema, buildResumeFromPartial } from "@/lib/import-schema";
import { extractFileText } from "@/lib/extract-file-text";

/**
 * Markdown/文本简历导入面板。
 * AI 流式结构化(streamObject) → 每个 partial 写进 store → 表单与预览边收边填。
 * 覆盖当前简历，导入前二次确认。
 */
export function ImportPanel({ onClose }: { onClose: () => void }) {
  const setResume = useResumeStore((s) => s.setResume);
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [fileErr, setFileErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const started = useRef(false);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    setFileErr(null);
    setParsing(true);
    try {
      const extracted = await extractFileText(file);
      if (!extracted.trim()) throw new Error("文件里没有可识别的文字");
      setText(extracted);
    } catch (e) {
      setFileErr(e instanceof Error ? e.message : "文件解析失败");
    } finally {
      setParsing(false);
    }
  }

  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/import",
    schema: importResumeSchema,
  });

  // 流式过程中，每来一块 partial 就安全地映射成完整 Resume 覆盖到 store。
  useEffect(() => {
    if (object) setResume(buildResumeFromPartial(object));
  }, [object, setResume]);

  const canImport = text.trim().length > 0 && !isLoading && !parsing;

  function handleImport() {
    if (!canImport) return;
    if (!confirm("导入将覆盖当前简历的全部内容，确定继续？")) return;
    started.current = true;
    submit({ text });
  }

  const done = started.current && !isLoading && !error && object;

  return (
    <div className="mb-4 rounded-card border border-line bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">导入简历</p>
          <p className="mt-0.5 text-xs text-muted">
            上传 PDF / Markdown，或粘贴文本，AI 自动识别并填入表单（覆盖当前内容）。
          </p>
        </div>
        <button onClick={onClose} className="text-xs text-muted hover:text-ink">
          关闭
        </button>
      </div>

      {/* 上传区：点击选文件或拖入 PDF/Markdown */}
      <input
        ref={fileInput}
        type="file"
        accept=".pdf,.md,.markdown,.txt,application/pdf,text/markdown,text/plain"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div
        onClick={() => !parsing && !isLoading && fileInput.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!parsing && !isLoading) handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`mb-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-3 text-xs transition ${
          dragOver ? "border-brand bg-brand-soft/50 text-brand-deep" : "border-line text-ink-2 hover:border-brand-line hover:bg-brand-soft/30"
        } ${parsing || isLoading ? "pointer-events-none opacity-60" : ""}`}
      >
        {parsing ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            正在解析文件…
          </>
        ) : (
          <>
            <UploadIcon />
            <span>
              点击上传或拖入 <span className="font-medium text-ink">PDF / Markdown</span> 文件
            </span>
          </>
        )}
      </div>
      {fileErr && <p className="mb-2 text-xs text-clay">{fileErr}</p>}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isLoading}
        rows={8}
        placeholder={"或直接粘贴：\n# 张三\n高级前端工程师 · 6年经验\n\n## 工作经历\n### 某公司 · 前端负责人 (2020.03 - 至今)\n- 主导 xxx，性能提升 60%\n..."}
        className="w-full resize-y rounded-lg border border-line bg-bg-2/50 px-3 py-2 font-mono text-xs leading-relaxed focus:border-brand focus:bg-white focus:outline-none disabled:opacity-60"
      />

      {error && (
        <p className="mt-2 text-xs text-red-500">
          识别失败，请重试（AI 功能需在 .env.local 配置 ANTHROPIC_API_KEY）。
        </p>
      )}

      <div className="mt-3 flex items-center gap-3">
        {isLoading ? (
          <>
            <button
              onClick={() => stop()}
              className="rounded-[9px] border border-line px-3 py-1.5 text-xs font-medium hover:border-brand-line"
            >
              停止
            </button>
            <span className="flex items-center gap-1.5 text-xs text-brand-deep">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
              正在识别并填入…
            </span>
          </>
        ) : (
          <button
            onClick={handleImport}
            disabled={!canImport}
            className="rounded-[9px] bg-brand px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-deep disabled:opacity-50"
          >
            开始导入
          </button>
        )}
        {done && <span className="text-xs text-emerald-600">✓ 已导入，右侧可继续编辑</span>}
      </div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
