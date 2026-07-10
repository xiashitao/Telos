"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResumePreview } from "@/components/resume-preview";
import { defaultResume } from "@/lib/store";
import { useResumeStore } from "@/lib/store";
import { useCustomTemplates } from "@/lib/custom-templates-store";
import { CUSTOM_PREFIX, parseSpec } from "@/lib/template-spec";
import type { TemplateSpec } from "@/lib/template-spec";

/**
 * 分享模板预览页 /t/[slug] —— 示例数据渲染分享的模板；
 * 「使用此模板」= fork：复制 spec 进访客本地模板库(无需登录)，跳编辑器。
 */
export default function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const add = useCustomTemplates((s) => s.add);
  const setTheme = useResumeStore((s) => s.setTheme);
  const [data, setData] = useState<{ name: string; spec: TemplateSpec } | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    fetch(`/api/share-template?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const spec = d ? parseSpec(d.spec) : null;
        if (d && spec) {
          setData({ name: d.name, spec });
          setStatus("ok");
        } else setStatus("missing");
      })
      .catch(() => setStatus("missing"));
  }, [slug]);

  function useTemplate() {
    if (!data) return;
    const id = add(data.name, data.spec); // fork：复制进本地，与原作者断开
    setTheme({ template: `${CUSTOM_PREFIX}${id}` });
    router.push("/editor");
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1000px] items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 text-sm">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-xs font-bold text-white">T</span>
            <span className="font-semibold">Telos 简历</span>
          </Link>
          {status === "ok" && (
            <button
              onClick={useTemplate}
              className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-deep"
            >
              使用此模板
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[1000px] px-5 py-8">
        {status === "loading" && <p className="py-20 text-center text-sm text-muted">加载中…</p>}
        {status === "missing" && (
          <div className="py-20 text-center">
            <p className="text-sm text-ink-2">分享不存在或已失效</p>
            <Link href="/templates" className="mt-2 inline-block text-xs text-brand hover:underline">
              去模板中心看看 →
            </Link>
          </div>
        )}
        {status === "ok" && data && (
          <>
            <div className="mb-5 text-center">
              <h1 className="text-lg font-bold">{data.name}</h1>
              <p className="mt-1 text-xs text-muted">来自用户分享的自定义模板 · 以下为示例数据预览</p>
            </div>
            <div className="mx-auto w-full rounded-card border border-line bg-bg-2/50 p-5 md:p-8" style={{ maxWidth: 860 }}>
              <div className="mx-auto w-full" style={{ maxWidth: 794 }}>
                <ResumePreview resume={defaultResume} customSpec={data.spec} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
