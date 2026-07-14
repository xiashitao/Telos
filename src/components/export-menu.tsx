"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { exportResumeServer } from "@/lib/export-pdf-server";
import type { Resume } from "@/lib/schema";
import type { ResumeTheme, SectionKey } from "@/lib/store";
import type { TemplateSpec } from "@/lib/template-spec";
import { CloudNote } from "@/components/local-mode";

export function ExportMenu({
  resume,
  theme,
  sectionOrder,
  customSpec,
}: {
  resume: Resume;
  theme: ResumeTheme;
  sectionOrder: SectionKey[];
  customSpec?: TemplateSpec;
}) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<null | "pdf" | "html">(null);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  async function run(format: "pdf" | "html") {
    close();
    if (exporting) return;
    setExporting(format);
    try {
      await exportResumeServer(resume, theme, sectionOrder, format, customSpec);
    } catch (e) {
      alert(e instanceof Error ? e.message : "导出失败,请重试");
      console.error(e);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={exporting !== null}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-1 disabled:opacity-60"
      >
        {exporting ? "生成中…" : "导出"}
        {!exporting && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" className={`transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M1.5 2.5L4 5.5L6.5 2.5" />
          </svg>
        )}
      </button>
      {open && (
        <div className="dropdown-in absolute right-0 top-full z-50 mt-1.5 min-w-[190px] rounded-lg border border-line bg-white p-1.5 shadow-pop">
          <MenuItem onClick={() => run("pdf")} title="PDF" desc="文字版 · ATS 友好" />
          <MenuItem onClick={() => run("html")} title="HTML" desc="自包含网页" />
          <div className="px-1"><CloudNote kind="export" /></div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ onClick, title, desc }: { onClick: () => void; title: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col rounded-lg px-2.5 py-2 text-left transition hover:bg-bg-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
    >
      <span className="text-xs font-medium text-ink">导出 {title}</span>
      <span className="text-[0.65rem] text-muted">{desc}</span>
    </button>
  );
}
