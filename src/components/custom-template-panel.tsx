"use client";

import { useResumeStore, themePresets } from "@/lib/store";
import { useCustomTemplates } from "@/lib/custom-templates-store";
import { CUSTOM_PREFIX } from "@/lib/template-spec";
import type { TemplateSpec } from "@/lib/template-spec";

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
