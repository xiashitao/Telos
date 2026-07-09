"use client";

import { useEffect, useRef, useState } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { useResumeStore } from "@/lib/store";
import type { Resume } from "@/lib/schema";
import { importResumeSchema, buildResumeFromPartial } from "@/lib/import-schema";

/**
 * 上下文式「按 JD 优化」——不占独立 tab。
 * 平时是一条安静的邀请；粘贴/展开 JD 后就地浮出「按此优化」，
 * AI 流式改写整份简历、实时覆盖右侧预览，且可一键撤销。
 */
export function JdTailorBar() {
  const setResume = useResumeStore((s) => s.setResume);
  const [open, setOpen] = useState(false);
  const [jd, setJd] = useState("");
  const [hasRun, setHasRun] = useState(false);
  const snapshot = useRef<Resume | null>(null);

  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/tailor",
    schema: importResumeSchema,
  });

  // 流式：每来一块 partial 就安全映射成完整 Resume 覆盖到 store（预览/表单实时更新）。
  useEffect(() => {
    if (object) setResume(buildResumeFromPartial(object));
  }, [object, setResume]);

  function tailor() {
    if (!jd.trim() || isLoading) return;
    const current = useResumeStore.getState().resume;
    snapshot.current = JSON.parse(JSON.stringify(current)) as Resume; // 改写前快照，供撤销
    setHasRun(true);
    submit({ resume: current, jd });
  }

  function revert() {
    if (snapshot.current) setResume(snapshot.current);
    setHasRun(false);
  }

  const done = hasRun && !isLoading && !error;

  // 收起态：一条安静的邀请
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group mb-4 flex w-full items-center gap-2.5 rounded-card border border-dashed border-line bg-white px-4 py-2.5 text-left text-xs text-ink-2 transition hover:border-brand-line hover:bg-brand-soft/40"
      >
        <Sparkle />
        <span>
          粘贴目标职位 <span className="font-medium text-ink">JD</span>，AI 按它帮你把简历改得更贴合
        </span>
        <span className="ml-auto text-brand-deep opacity-0 transition group-hover:opacity-100">展开 →</span>
      </button>
    );
  }

  return (
    <div className="mb-4 rounded-card border border-line bg-white p-4 shadow-card">
      <div className="mb-2 flex items-center gap-2">
        <Sparkle />
        <span className="text-xs font-semibold">按 JD 优化简历</span>
        <button
          onClick={() => setOpen(false)}
          className="ml-auto text-xs text-muted hover:text-ink"
        >
          收起
        </button>
      </div>

      <textarea
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        disabled={isLoading}
        rows={4}
        placeholder="粘贴目标职位的 JD 描述…AI 会在不编造的前提下，把你确实具备、且 JD 看重的能力更好地凸显出来。"
        className="w-full resize-y rounded-lg border border-line bg-bg-2/50 px-3 py-2 text-xs leading-relaxed focus:border-brand focus:bg-white focus:outline-none disabled:opacity-60"
      />

      {error && (
        <p className="mt-2 text-xs text-clay">
          改写失败，请重试（AI 功能需在 .env.local 配置 ANTHROPIC_API_KEY）。
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
              正在按 JD 改写…右侧预览实时更新
            </span>
          </>
        ) : (
          <>
            <button
              onClick={tailor}
              disabled={!jd.trim()}
              className="flex items-center gap-1.5 rounded-[9px] bg-brand px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-deep disabled:opacity-50"
            >
              <Sparkle light />
              {hasRun ? "重新优化" : "按此 JD 优化"}
            </button>
            {done && (
              <>
                <span className="text-xs text-emerald-600">✓ 已按 JD 优化</span>
                <button onClick={revert} className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline">
                  撤销
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Sparkle({ light }: { light?: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke={light ? "currentColor" : "var(--color-brand)"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.9 5.8L20 10l-5 3.6L16.5 20 12 16.5 7.5 20 9 13.6 4 10l6.1-1.2L12 3z" />
    </svg>
  );
}
