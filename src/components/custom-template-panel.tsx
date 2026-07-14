"use client";

import { useEffect, useRef, useState } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { useResumeStore, themePresets } from "@/lib/store";
import { useCustomTemplates } from "@/lib/custom-templates-store";
import { CUSTOM_PREFIX, templateSpecSchema, mergeSpecPartial } from "@/lib/template-spec";
import type { TemplateSpec } from "@/lib/template-spec";
import { useLocalMode } from "@/components/local-mode";

/**
 * 自定义模板面板 —— 新建/选择/命名/删除自定义模板，逐参调整 TemplateSpec。
 * 改动实时写入 store，右侧预览即时反映（所见即所得）。
 */
export function CustomTemplatePanel({ onClose }: { onClose: () => void }) {
  const { items, add, rename, updateSpec, remove } = useCustomTemplates();
  const { theme, setTheme } = useResumeStore();

  const activeId = theme.template.startsWith(CUSTOM_PREFIX)
    ? theme.template.slice(CUSTOM_PREFIX.length)
    : null;
  const active = items.find((t) => t.id === activeId) ?? null;

  function createNew() {
    const id = add();
    setTheme({ template: `${CUSTOM_PREFIX}${id}` });
  }

  function patch(p: Partial<TemplateSpec>) {
    if (active) updateSpec(active.id, p);
  }

  return (
    <div className="mb-4 rounded-card border border-line bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">自定义模板</p>
          <p className="mt-0.5 text-xs text-muted">调整参数实时生效；模板保存在本地，可随时切换回内置模板。</p>
        </div>
        <button onClick={onClose} className="text-xs text-muted hover:text-ink">✕</button>
      </div>

      {/* 我的模板列表 */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {items.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme({ template: `${CUSTOM_PREFIX}${t.id}` })}
            className={`rounded-md px-2.5 py-1 text-xs transition ${
              t.id === activeId ? "bg-brand text-white" : "border border-line text-ink-2 hover:bg-bg-2"
            }`}
          >
            {t.name}
          </button>
        ))}
        <button onClick={createNew} className="rounded-md border border-dashed border-line px-2.5 py-1 text-xs text-brand hover:border-brand-line">
          + 新建模板
        </button>
      </div>

      {/* vibe coding：截图 → AI 生成模板参数 */}
      <VibeSection
        onStart={() => {
          if (active) return active.id;
          const id = add("截图模板");
          setTheme({ template: `${CUSTOM_PREFIX}${id}` });
          return id;
        }}
        applySpec={(id, spec) => updateSpec(id, spec)}
      />

      {!active ? (
        <p className="text-xs text-muted">选择或新建一个自定义模板开始调整。</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              value={active.name}
              onChange={(e) => rename(active.id, e.target.value)}
              className="w-40 rounded-md border border-line px-2.5 py-1 text-xs focus:border-brand focus:outline-none"
            />
            <ShareButton name={active.name} spec={active.spec} />
            <button
              onClick={() => {
                if (!confirm(`删除模板「${active.name}」？`)) return;
                remove(active.id);
                setTheme({ template: "classic" });
              }}
              className="text-xs text-red-500 hover:text-red-600"
            >
              删除
            </button>
          </div>

          <Field label="骨架">
            <Seg
              value={active.spec.skeleton}
              onChange={(v) => patch({ skeleton: v as TemplateSpec["skeleton"] })}
              options={[["single", "单栏"], ["sidebar-left", "左侧栏"], ["sidebar-right", "右侧栏"], ["banner", "顶部色带"]]}
            />
          </Field>

          {(active.spec.skeleton === "sidebar-left" || active.spec.skeleton === "sidebar-right") && (
            <Field label={`侧栏宽度 ${active.spec.sidebarRatio}%`}>
              <input
                type="range"
                min={24}
                max={42}
                value={active.spec.sidebarRatio}
                onChange={(e) => patch({ sidebarRatio: Number(e.target.value) })}
                className="w-40 accent-[var(--color-brand)]"
              />
            </Field>
          )}

          <Field label="页头">
            <Seg
              value={active.spec.header.align}
              onChange={(v) => patch({ header: { ...active.spec.header, align: v as "left" | "center" } })}
              options={[["left", "左对齐"], ["center", "居中"]]}
            />
            <Seg
              value={active.spec.header.style}
              onChange={(v) => patch({ header: { ...active.spec.header, style: v as TemplateSpec["header"]["style"] } })}
              options={[["plain", "素净"], ["underline", "下划线"], ["band", "色带"]]}
            />
            <Seg
              value={active.spec.header.nameScale}
              onChange={(v) => patch({ header: { ...active.spec.header, nameScale: v as TemplateSpec["header"]["nameScale"] } })}
              options={[["md", "小"], ["lg", "中"], ["xl", "大"]]}
            />
          </Field>

          <Field label="模块标题">
            <Seg
              value={active.spec.section.titleStyle}
              onChange={(v) => patch({ section: { ...active.spec.section, titleStyle: v as TemplateSpec["section"]["titleStyle"] } })}
              options={[["caps", "彩色"], ["underline", "下划线"], ["leftbar", "左色条"], ["band", "色带底"]]}
            />
            <Seg
              value={active.spec.section.titleLang}
              onChange={(v) => patch({ section: { ...active.spec.section, titleLang: v as "zh" | "en" } })}
              options={[["zh", "中文"], ["en", "English"]]}
            />
          </Field>

          <Field label="排版">
            <Seg
              value={active.spec.section.density}
              onChange={(v) => patch({ section: { ...active.spec.section, density: v as TemplateSpec["section"]["density"] } })}
              options={[["compact", "紧凑"], ["normal", "标准"], ["loose", "宽松"]]}
            />
            <Seg
              value={active.spec.typography.font}
              onChange={(v) => patch({ typography: { font: v as TemplateSpec["typography"]["font"] } })}
              options={[["sans", "无衬线"], ["serif", "衬线"], ["mono", "等宽"]]}
            />
          </Field>

          <Field label="强调色">
            <div className="flex items-center gap-1.5">
              {themePresets.accents.map((a) => (
                <button
                  key={a.id}
                  title={a.label}
                  onClick={() => patch({ colors: { ...active.spec.colors, accent: a.value } })}
                  className={`h-5 w-5 rounded-full transition ${
                    active.spec.colors.accent === a.value ? "ring-2 ring-brand ring-offset-1" : "hover:scale-110"
                  }`}
                  style={{ background: a.value }}
                />
              ))}
            </div>
          </Field>

          {(active.spec.skeleton === "sidebar-left" || active.spec.skeleton === "sidebar-right") && (
            <Field label="侧栏底色">
              <div className="flex items-center gap-1.5">
                <SwatchOff
                  active={active.spec.colors.sidebarBg === ""}
                  onClick={() => patch({ colors: { ...active.spec.colors, sidebarBg: "" } })}
                />
                {themePresets.accents.map((a) => (
                  <button
                    key={a.id}
                    title={a.label}
                    onClick={() => patch({ colors: { ...active.spec.colors, sidebarBg: a.value } })}
                    className={`h-5 w-5 rounded-full transition ${
                      active.spec.colors.sidebarBg === a.value ? "ring-2 ring-brand ring-offset-1" : "hover:scale-110"
                    }`}
                    style={{ background: a.value }}
                  />
                ))}
              </div>
            </Field>
          )}
        </div>
      )}
    </div>
  );
}

/** 分享当前模板：POST 到服务端拿分享链接并复制到剪贴板；未登录时引导去登录 */
function ShareButton({ name, spec }: { name: string; spec: TemplateSpec }) {
  const localMode = useLocalMode();
  const [state, setState] = useState<"idle" | "busy" | "copied">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [needLogin, setNeedLogin] = useState(false);

  // 本地模式：分享是唯一的云写入，关闭它并说明
  if (localMode) {
    return (
      <span className="text-[0.66rem] text-muted" title="分享会把模板上传到服务器，本地模式下已关闭">
        本地模式已关闭分享
      </span>
    );
  }

  async function share() {
    if (state === "busy") return;
    setState("busy");
    setErr(null);
    setNeedLogin(false);
    try {
      const res = await fetch("/api/share-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, spec }),
      });
      const data = await res.json();
      if (res.status === 401) {
        setNeedLogin(true);
        setState("idle");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "分享失败");
      await navigator.clipboard.writeText(data.url).catch(() => prompt("复制分享链接：", data.url));
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "分享失败");
      setState("idle");
    }
  }

  return (
    <span className="flex items-center gap-1.5">
      <button onClick={share} className="text-xs text-brand hover:text-brand-deep" disabled={state === "busy"}>
        {state === "busy" ? "生成链接…" : state === "copied" ? "✓ 链接已复制" : "分享"}
      </button>
      {needLogin && (
        <a
          href={`/api/auth/login?next=${encodeURIComponent(typeof window === "undefined" ? "/editor" : window.location.href)}`}
          className="text-[0.66rem] text-brand underline underline-offset-2"
        >
          分享需登录，去登录 →
        </a>
      )}
      {err && <span className="text-[0.66rem] text-clay">{err}</span>}
    </span>
  );
}

/**
 * 截图生成模板(vibe coding)：上传简历截图 → AI 流式还原成 TemplateSpec，
 * 每个 partial 都经 mergeSpecPartial 补全校验后实时写入当前模板(预览同步长出来)。
 */
function VibeSection({
  onStart,
  applySpec,
}: {
  /** 确保有一个自定义模板可写入，返回其 id（无则创建） */
  onStart: () => string;
  applySpec: (id: string, spec: TemplateSpec) => void;
}) {
  const [image, setImage] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/vibe-template",
    schema: templateSpecSchema,
  });

  // 流式：partial → 补全成合法 spec → 实时写入目标模板
  useEffect(() => {
    if (object && targetId) applySpec(targetId, mergeSpecPartial(object));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object, targetId]);

  function pickFile(file: File | undefined | null) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  function generate() {
    if (!image || isLoading) return;
    const id = onStart();
    setTargetId(id);
    submit({ image });
  }

  return (
    <div className="mb-3 rounded-lg border border-dashed border-line p-3">
      <div className="flex items-center gap-2.5">
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ""; }}
        />
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="截图" className="h-12 w-9 cursor-pointer rounded border border-line object-cover" onClick={() => fileInput.current?.click()} />
        ) : (
          <button
            onClick={() => fileInput.current?.click()}
            className="grid h-12 w-9 place-items-center rounded border border-dashed border-line text-lg text-muted hover:border-brand-line hover:text-brand"
          >
            +
          </button>
        )}
        <div className="flex-1">
          <p className="text-xs font-medium">截图生成模板</p>
          <p className="text-[0.66rem] leading-snug text-muted">
            上传一张简历截图，AI 还原它的版式（神似而非复刻）。请注意他人模板设计的版权。
          </p>
        </div>
        {isLoading ? (
          <button onClick={() => stop()} className="rounded-[9px] border border-line px-3 py-1.5 text-xs hover:border-brand-line">
            停止
          </button>
        ) : (
          <button
            onClick={generate}
            disabled={!image}
            className="rounded-[9px] bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-deep disabled:opacity-50"
          >
            生成
          </button>
        )}
      </div>
      {isLoading && (
        <p className="mt-2 flex items-center gap-1.5 text-[0.68rem] text-brand-deep">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
          正在识别版式…右侧预览实时更新，生成后可继续手动微调
        </p>
      )}
      {error && (
        <p className="mt-2 text-[0.68rem] text-clay">生成失败，请重试（需在 .env.local 配置 ANTHROPIC_API_KEY）。</p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 shrink-0 text-xs text-ink-2">{label}</span>
      {children}
    </div>
  );
}

function Seg({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="flex rounded-md border border-line text-xs">
      {options.map(([v, label], i) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-2 py-1 transition ${i > 0 ? "border-l border-line" : ""} ${
            value === v ? "bg-brand text-white" : "text-ink-2 hover:bg-bg-2"
          } ${i === 0 ? "rounded-l-[5px]" : ""} ${i === options.length - 1 ? "rounded-r-[5px]" : ""}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** 「无底色」swatch */
function SwatchOff({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      title="浅灰纸面"
      onClick={onClick}
      className={`grid h-5 w-5 place-items-center rounded-full border border-line bg-white text-[0.6rem] text-muted transition ${
        active ? "ring-2 ring-brand ring-offset-1" : "hover:scale-110"
      }`}
    >
      无
    </button>
  );
}
