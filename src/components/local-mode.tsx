"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "@/lib/prefs-store";

/**
 * 导航栏本地模式控件：一个开关 + 开启时的「数据仅存本地」徽标。
 * 需在挂载后再读 store（localStorage），避免 hydration mismatch。
 */
export function LocalModeControls() {
  const [mounted, setMounted] = useState(false);
  const localMode = usePrefs((s) => s.localMode);
  const toggle = usePrefs((s) => s.toggleLocalMode);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2.5">
      {localMode && (
        <span
          className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.7rem] font-medium text-emerald-700 sm:inline-flex"
          title="你的简历与自定义模板只保存在本浏览器；未开启任何云端保存。AI 与导出会临时经服务器处理，但不会保存你的数据。"
        >
          <LockIcon /> 数据仅存本地
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={localMode}
        onClick={toggle}
        title={localMode ? "关闭本地模式" : "开启本地模式：隐藏分享/登录，数据只留在本机"}
        className="flex items-center gap-1.5 text-[0.8rem] text-ink-2 transition hover:text-ink"
      >
        <span
          className={`relative inline-flex h-4 w-7 items-center rounded-full transition ${
            localMode ? "bg-emerald-500" : "bg-line"
          }`}
        >
          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${localMode ? "translate-x-3.5" : "translate-x-0.5"}`} />
        </span>
        <span className="hidden md:inline">本地模式</span>
      </button>
    </div>
  );
}

/** AI / 导出处的透明提示：仅本地模式下显示。 */
export function CloudNote({ kind }: { kind: "ai" | "export" }) {
  const [mounted, setMounted] = useState(false);
  const localMode = usePrefs((s) => s.localMode);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  if (!mounted || !localMode) return null;
  const text =
    kind === "export"
      ? "本地模式：导出会把简历临时发送到服务器渲染 PDF，处理完即弃、不保存。"
      : "本地模式：该 AI 功能会把内容临时发送到服务器处理，不会保存你的数据。";
  return <p className="mt-2 flex items-start gap-1 text-[0.66rem] leading-snug text-muted"><LockIcon /> {text}</p>;
}

/** 是否本地模式（客户端 hook，挂载前返回 false）。 */
export function useLocalMode(): boolean {
  const [mounted, setMounted] = useState(false);
  const localMode = usePrefs((s) => s.localMode);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  return mounted && localMode;
}

function LockIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-[1px] shrink-0">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
