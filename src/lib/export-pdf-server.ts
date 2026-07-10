"use client";

import type { Resume } from "@/lib/schema";
import type { ResumeTheme, SectionKey } from "@/lib/store";
import type { TemplateSpec } from "@/lib/template-spec";

/**
 * 触发服务端导出：把简历数据 POST 给 /api/export，服务端用 headless 浏览器渲染
 * 真·文字版 A4 PDF（ATS 可读、自动分页），返回后在浏览器触发下载。
 *
 * 收费闸门在服务端（见 MONETIZATION.md）——前端只管发起与下载。
 */
export async function exportResumeServer(
  resume: Resume,
  theme: ResumeTheme,
  sectionOrder: SectionKey[],
  format: "pdf" | "html" = "pdf",
  customSpec?: TemplateSpec,
): Promise<void> {
  const res = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume, theme, sectionOrder, format, customSpec }),
  });
  if (!res.ok) {
    let msg = "导出失败,请重试";
    try {
      msg = (await res.json()).error ?? msg;
    } catch {
      /* 非 JSON 响应,用默认文案 */
    }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${resume.basics.name?.trim() || "我的简历"}-Telos简历.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
