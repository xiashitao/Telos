"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ResumePreview } from "@/components/resume-preview";
import { useResumeStore, themePresets, sectionMeta } from "@/lib/store";
import type { ResumeTheme, SectionKey } from "@/lib/store";
import { templates } from "@/lib/templates";
import { usePageOverflow } from "@/lib/use-page-overflow";
import { AiAnalysisPanel } from "@/components/ai-analysis-panel";
import { SmartOnePagePanel } from "@/components/smart-one-page-panel";
import { ImportPanel } from "@/components/import-panel";
import { JdTailorPanel } from "@/components/jd-tailor-bar";
import { CustomTemplatePanel } from "@/components/custom-template-panel";
import { LocalModeControls } from "@/components/local-mode";
import { useCustomTemplates } from "@/lib/custom-templates-store";
import { CUSTOM_PREFIX } from "@/lib/template-spec";
import { ExportMenu } from "@/components/export-menu";
import { EnhanceButton } from "@/components/enhance-button";
import { SortableList, SortableItem } from "@/components/sortable";
import { ToolbarDropdown, DropdownItem } from "@/components/toolbar-dropdown";
import { TemplateThumb } from "@/components/template-thumb";
import { RichTextEditor } from "@/components/rich-text-editor";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30";

const inputCls =
  `mt-1 w-full rounded-lg border border-line bg-bg-2/50 px-3 py-2 text-sm font-cn transition ${focusRing} focus:border-brand focus:bg-white focus:outline-none`;
const labelCls = "text-xs font-medium text-ink-2";
const subInputCls =
  `rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-cn transition ${focusRing} focus:border-brand focus:outline-none`;

const tabMeta: { key: SectionKey; label: string }[] = [
  { key: "experiences", label: "经历" },
  { key: "projects", label: "项目" },
  { key: "education", label: "教育" },
  { key: "skills", label: "技能" },
  { key: "certificates", label: "证书" },
  { key: "languages", label: "语言" },
  { key: "awards", label: "奖项" },
];

type TabKey = SectionKey | "basics" | "order";

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <EditorPageInner />
    </Suspense>
  );
}

function EditorPageInner() {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<TabKey>("basics");
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [onePageOpen, setOnePageOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [tailorOpen, setTailorOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [tplPickerOpen, setTplPickerOpen] = useState(false);
  const tplPickerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const { overflowing, pageCount } = usePageOverflow();
  // SSR 水合守卫：仅挂载后渲染依赖 localStorage 的内容，避免 hydration mismatch
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!tplPickerOpen) return;
    function onDoc(e: MouseEvent) {
      if (tplPickerRef.current && !tplPickerRef.current.contains(e.target as Node)) setTplPickerOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setTplPickerOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [tplPickerOpen]);

  const s = useResumeStore();
  const { resume, sectionOrder, theme, setTheme } = s;
  const customItems = useCustomTemplates((st) => st.items);

  useEffect(() => {
    const tid = searchParams.get("template");
    if (!tid) return;
    const t = templates.find((tpl) => tpl.id === tid);
    if (t) setTheme({ template: t.id, accent: t.accent });
  }, [searchParams, setTheme]);

  function togglePanel(panel: "import" | "tailor" | "analysis" | "onePage" | "custom") {
    setImportOpen(panel === "import" ? (v) => !v : false);
    setTailorOpen(panel === "tailor" ? (v) => !v : false);
    setAnalysisOpen(panel === "analysis" ? (v) => !v : false);
    setOnePageOpen(panel === "onePage" ? (v) => !v : false);
    setCustomOpen(panel === "custom" ? (v) => !v : false);
  }

  if (!mounted) return <div className="min-h-screen bg-bg" />;

  const toolbarBtnCls = (active: boolean) =>
    `hidden items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition md:inline-flex ${focusRing} ${
      active ? "border-brand bg-brand-soft text-brand-deep" : "border-line hover:border-brand-line hover:bg-brand-soft hover:text-brand-deep"
    }`;

  const activePanel = importOpen ? "import" : tailorOpen ? "tailor" : analysisOpen ? "analysis" : onePageOpen ? "onePage" : customOpen ? "custom" : null;

  const customSpec = theme.template.startsWith(CUSTOM_PREFIX)
    ? customItems.find((t) => t.id === theme.template.slice(CUSTOM_PREFIX.length))?.spec
    : undefined;

  return (
    <>
      {/* toolbar */}
      <div className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-3 px-5 md:px-10">
          <Link href="/" className={`flex items-center gap-2 text-sm ${focusRing} rounded-lg`}>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-xs font-bold text-white">T</span>
            <span className="hidden font-semibold sm:inline">我的简历</span>
          </Link>
          <div className="hidden items-center gap-1.5 text-xs lg:flex">
            <div ref={tplPickerRef} className="relative">
              <button
                type="button"
                onClick={() => setTplPickerOpen((v) => !v)}
                className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${focusRing} ${
                  tplPickerOpen
                    ? "border-brand bg-brand-soft text-brand-deep"
                    : "border-line bg-white text-ink-2 hover:border-brand-line hover:text-brand-deep"
                }`}
              >
                {customSpec
                  ? customItems.find((t) => `${CUSTOM_PREFIX}${t.id}` === theme.template)?.name ?? "自定义"
                  : templates.find((t) => t.id === theme.template)?.name ?? "模板"}
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" className={`ml-0.5 transition-transform ${tplPickerOpen ? "rotate-180" : ""}`}><path d="M1.5 2.5L4 5.5L6.5 2.5" /></svg>
              </button>
              {tplPickerOpen && (
                <div className="dropdown-in absolute left-0 top-full z-50 mt-1.5 max-h-[70vh] w-[420px] overflow-y-auto rounded-xl border border-line bg-white p-3 shadow-pop">
                  {/* 自定义模板区 */}
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[0.65rem] font-medium text-muted">我的模板</span>
                    {customItems.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => { setTheme({ template: `${CUSTOM_PREFIX}${t.id}` }); setTplPickerOpen(false); }}
                        className={`rounded-md px-2 py-0.5 text-[0.68rem] transition ${
                          theme.template === `${CUSTOM_PREFIX}${t.id}`
                            ? "bg-brand text-white"
                            : "border border-line text-ink-2 hover:bg-bg-2"
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => { setTplPickerOpen(false); togglePanel("custom"); }}
                      className="rounded-md border border-dashed border-line px-2 py-0.5 text-[0.68rem] text-brand hover:border-brand-line"
                    >
                      + 自定义
                    </button>
                  </div>
                  <div className="mb-1.5 border-t border-line" />
                  <div className="grid grid-cols-4 gap-2.5">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => { setTheme({ template: t.id, accent: t.accent }); setTplPickerOpen(false); }}
                        className={`group/tpl rounded-lg border p-1.5 transition ${focusRing} ${
                          theme.template === t.id
                            ? "border-brand bg-brand-soft ring-1 ring-brand/20"
                            : "border-line hover:border-brand-line hover:shadow-sm"
                        }`}
                      >
                        <div className="overflow-hidden rounded" style={{ fontSize: "0.55rem" }}>
                          <TemplateThumb template={t} />
                        </div>
                        <p className={`mt-1.5 truncate text-center text-[0.65rem] font-medium ${
                          theme.template === t.id ? "text-brand-deep" : "text-ink-2 group-hover/tpl:text-ink"
                        }`}>
                          {t.name}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <ToolbarDropdown label={themePresets.fonts.find((f) => f.id === theme.font)?.label ?? "字体"}>
              {themePresets.fonts.map((f) => (
                <DropdownItem key={f.id} active={theme.font === f.id} onClick={() => setTheme({ font: f.id })}>
                  <span style={{ fontFamily: f.css }}>{f.label}</span>
                </DropdownItem>
              ))}
            </ToolbarDropdown>
            <ToolbarDropdown label={<><span className="h-3 w-3 rounded-full" style={{ background: theme.accent }} />{themePresets.accents.find((a) => a.value === theme.accent)?.label ?? "配色"}</>}>
              {themePresets.accents.map((a) => (
                <DropdownItem key={a.id} active={theme.accent === a.value} onClick={() => setTheme({ accent: a.value })}>
                  <span className="h-3 w-3 rounded-full" style={{ background: a.value }} />
                  {a.label}
                </DropdownItem>
              ))}
            </ToolbarDropdown>
            <ToolbarDropdown label={<><SpacingIcon spacing={theme.spacing} />{themePresets.spacings.find((sp) => sp.id === theme.spacing)?.label ?? "间距"}</>}>
              {themePresets.spacings.map((sp) => (
                <DropdownItem key={sp.id} active={theme.spacing === sp.id} onClick={() => setTheme({ spacing: sp.id as ResumeTheme["spacing"] })}>
                  <SpacingIcon spacing={sp.id as ResumeTheme["spacing"]} />
                  {sp.label}
                </DropdownItem>
              ))}
            </ToolbarDropdown>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-xs text-muted md:flex fade-in">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> 已自动保存
            </span>
            <LocalModeControls />
            <button onClick={() => togglePanel("import")} className={toolbarBtnCls(importOpen)}>
              导入
            </button>
            <button onClick={() => togglePanel("tailor")} className={toolbarBtnCls(tailorOpen)}>
              按 JD 优化
            </button>
            <button onClick={() => togglePanel("analysis")} className={toolbarBtnCls(analysisOpen)}>
              AI 分析
            </button>
            <button onClick={() => togglePanel("onePage")} className={toolbarBtnCls(onePageOpen)}>
              智能一页
              {overflowing && <span className="h-1.5 w-1.5 rounded-full bg-clay" />}
            </button>
            <ExportMenu resume={resume} theme={theme} sectionOrder={sectionOrder} customSpec={customSpec} />
          </div>
        </div>
      </div>

      {/* main */}
      <div className="mx-auto max-w-[1440px] px-5 py-6 md:px-10">
        <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
          {/* form */}
          <div>
            {activePanel && (
              <div className="panel-in mb-5">
                {importOpen && <ImportPanel onClose={() => setImportOpen(false)} />}
                {tailorOpen && <JdTailorPanel onClose={() => setTailorOpen(false)} />}
                {customOpen && <CustomTemplatePanel onClose={() => setCustomOpen(false)} />}
                {analysisOpen && <AiAnalysisPanel resume={resume} onClose={() => setAnalysisOpen(false)} />}
                {onePageOpen && <SmartOnePagePanel overflowing={overflowing} pageCount={pageCount} onClose={() => setOnePageOpen(false)} />}
              </div>
            )}
            <div className="rounded-card border border-line bg-white p-5 shadow-card md:p-7">
              <TabBar tab={tab} sectionOrder={sectionOrder} onTabChange={setTab} />

              <div key={tab} className="fade-in">
                {tab === "basics" && <BasicsForm />}
                {tab === "order" && <SectionOrderForm />}
                {tab === "experiences" && <ExperiencesForm />}
                {tab === "projects" && <ProjectsForm />}
                {tab === "education" && <EducationForm />}
                {tab === "skills" && <SkillsForm />}
                {tab === "certificates" && <CertificatesForm />}
                {tab === "languages" && <LanguagesForm />}
                {tab === "awards" && <AwardsForm />}
              </div>

              <button
                onClick={() => { if (confirm("重置为示例数据?当前编辑内容将被清除。")) s.reset(); }}
                className={`mt-7 text-xs text-muted transition hover:text-ink ${focusRing} rounded-md px-1 py-0.5`}
              >
                重置为示例数据
              </button>
            </div>
          </div>

          {/* preview */}
          <div>
            <div className="rounded-card border border-line bg-gradient-to-b from-bg-2/80 to-bg-2 p-5 md:p-8" style={{ minHeight: "calc(100vh - 7rem)" }}>
              <div className="mx-auto w-full" style={{ maxWidth: "794px" }}>
                <ResumePreview resume={resume} theme={theme} sectionOrder={sectionOrder} customSpec={customSpec} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ===== Tab 栏 ===== */
function TabBar({ tab, sectionOrder, onTabChange }: { tab: TabKey; sectionOrder: SectionKey[]; onTabChange: (t: TabKey) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function check() {
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 2);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
    }
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", check); ro.disconnect(); };
  }, []);

  const allTabs: { key: TabKey; label: string }[] = [
    { key: "basics", label: "个人信息" },
    ...sectionOrder.map((key) => tabMeta.find((t) => t.key === key)!).filter(Boolean),
    { key: "order", label: "模块排序" },
  ];

  return (
    <div className="relative mb-5">
      {canScrollLeft && <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-6 bg-gradient-to-r from-white to-transparent" />}
      {canScrollRight && <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-6 bg-gradient-to-l from-white to-transparent" />}
      <div
        ref={scrollRef}
        role="tablist"
        className="flex gap-1 overflow-x-auto text-xs font-medium"
        style={{ scrollbarWidth: "none" }}
      >
        {allTabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => onTabChange(t.key)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 transition ${focusRing} ${
              tab === t.key ? "bg-brand text-white shadow-sm" : "text-ink-2 hover:bg-bg-2"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===== 照片压缩 ===== */
function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 400;
      let { width: w, height: h } = img;
      if (w > MAX || h > MAX) {
        const scale = MAX / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/* ===== 个人信息 ===== */
function BasicsForm() {
  const { resume, setBasics } = useResumeStore();
  const b = resume.basics;
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressPhoto(file);
    setBasics({ photo: dataUrl });
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <label className="col-span-2 block">
        <span className={labelCls}>姓名</span>
        <input className={inputCls} value={b.name} onChange={(e) => setBasics({ name: e.target.value })} />
      </label>
      <label className="col-span-2 block">
        <span className={labelCls}>一句话定位</span>
        <input className={inputCls} value={b.headline} onChange={(e) => setBasics({ headline: e.target.value })} />
      </label>
      <label className="block">
        <span className={labelCls}>邮箱</span>
        <input className={inputCls} value={b.email} onChange={(e) => setBasics({ email: e.target.value })} />
      </label>
      <label className="block">
        <span className={labelCls}>电话</span>
        <input className={inputCls} value={b.phone} onChange={(e) => setBasics({ phone: e.target.value })} />
      </label>
      <label className="block">
        <span className={labelCls}>所在城市</span>
        <input className={inputCls} value={b.location} onChange={(e) => setBasics({ location: e.target.value })} />
      </label>
      <label className="block">
        <span className={labelCls}>到岗时间</span>
        <input className={inputCls} value={b.availability} onChange={(e) => setBasics({ availability: e.target.value })} placeholder="随时 / 一周内 / 一个月" />
      </label>
      <label className="col-span-2 block">
        <span className={labelCls}>个人简介</span>
        <RichTextEditor value={b.summary} onChange={(html) => setBasics({ summary: html })} placeholder="一段话介绍你的核心能力与亮点…" className="mt-1" rows={3} />
      </label>
    </div>
  );
}

/* ===== 模块排序 ===== */
function SectionOrderForm() {
  const { sectionOrder, reorderSections } = useResumeStore();
  return (
    <div>
      <p className="mb-3 text-sm font-semibold">拖拽调整模块顺序</p>
      <p className="mb-4 text-xs text-muted">右侧预览会按此顺序展示(空模块自动隐藏)。</p>
      <SortableList ids={sectionOrder} onReorder={reorderSections}>
        {sectionOrder.map((key) => (
          <SortableItem key={key} id={key}>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-bg-2/40 px-3.5 py-2.5 transition hover:border-brand-line hover:shadow-sm">
              <span className="text-sm font-medium">{sectionMeta[key].title.replace(" ", "")}</span>
              <span className="ml-auto font-mono text-[0.65rem] text-faint">{key}</span>
            </div>
          </SortableItem>
        ))}
      </SortableList>
    </div>
  );
}

/* ===== 经历 ===== */
function ExperiencesForm() {
  const { resume, addExperience, updateExperience, removeExperience, reorderExperiences } = useResumeStore();
  return (
    <div>
      <ListHeader title="工作经历" onAdd={addExperience} addLabel="+ 新增经历" />
      <SortableList ids={resume.experiences.map((e) => e.id)} onReorder={reorderExperiences}>
        {resume.experiences.map((e) => (
          <SortableItem key={e.id} id={e.id}>
            <Card onDelete={() => removeExperience(e.id)}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input className={subInputCls} placeholder="公司 · 职位" value={`${e.company}${e.position ? ` · ${e.position}` : ""}`} onChange={(ev) => { const [c, p] = ev.target.value.split("·").map((x) => x.trim()); updateExperience(e.id, { company: c ?? "", position: p ?? "" }); }} />
                <input className={subInputCls} placeholder="2021.03 — 至今" value={e.current ? `${e.startDate} — 至今` : `${e.startDate}${e.endDate ? ` — ${e.endDate}` : ""}`} onChange={(ev) => { const [st, en] = ev.target.value.split("—").map((x) => x.trim()); updateExperience(e.id, { startDate: st ?? "", endDate: en === "至今" ? "" : en ?? "", current: en === "至今" }); }} />
              </div>
              <RichTextEditor value={e.bullets[0] ?? ""} onChange={(html) => updateExperience(e.id, { bullets: [html] })} placeholder="写下你的经历亮点,可加粗关键成果…" className="mt-2.5" rows={3} />
              <EnhanceButton bullets={e.bullets} position={e.position && e.company ? `${e.position} @ ${e.company}` : undefined} onApply={(t) => updateExperience(e.id, { bullets: [t] })} />
            </Card>
          </SortableItem>
        ))}
      </SortableList>
    </div>
  );
}

/* ===== 项目 ===== */
function ProjectsForm() {
  const { resume, addProject, updateProject, removeProject, reorderProjects } = useResumeStore();
  return (
    <div>
      <ListHeader title="项目经历" onAdd={addProject} addLabel="+ 新增项目" />
      <SortableList ids={resume.projects.map((p) => p.id)} onReorder={reorderProjects}>
        {resume.projects.map((p) => (
          <SortableItem key={p.id} id={p.id}>
            <Card onDelete={() => removeProject(p.id)}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input className={subInputCls} placeholder="项目名称" value={p.name} onChange={(e) => updateProject(p.id, { name: e.target.value })} />
                <input className={subInputCls} placeholder="担任角色" value={p.role} onChange={(e) => updateProject(p.id, { role: e.target.value })} />
              </div>
              <input className={`${subInputCls} mt-2 w-full`} placeholder="链接(可选)" value={p.link} onChange={(e) => updateProject(p.id, { link: e.target.value })} />
              <RichTextEditor value={p.bullets[0] ?? ""} onChange={(html) => updateProject(p.id, { bullets: [html] })} placeholder="项目描述与你的贡献…" className="mt-2.5" rows={2} />
            </Card>
          </SortableItem>
        ))}
      </SortableList>
    </div>
  );
}

/* ===== 教育 ===== */
function EducationForm() {
  const { resume, addEducation, updateEducation, removeEducation, reorderEducation } = useResumeStore();
  return (
    <div>
      <ListHeader title="教育经历" onAdd={addEducation} addLabel="+ 新增" />
      <SortableList ids={resume.education.map((e) => e.id)} onReorder={reorderEducation}>
        {resume.education.map((ed) => (
          <SortableItem key={ed.id} id={ed.id}>
            <Card onDelete={() => removeEducation(ed.id)}>
              <div className="grid grid-cols-2 gap-3">
                <input className={`${subInputCls} col-span-2 font-cn`} placeholder="学校" value={ed.school} onChange={(e) => updateEducation(ed.id, { school: e.target.value })} />
                <input className={`${subInputCls} font-cn`} placeholder="专业" value={ed.major} onChange={(e) => updateEducation(ed.id, { major: e.target.value })} />
                <input className={subInputCls} placeholder="2014 — 2018" value={`${ed.startDate}${ed.endDate ? ` — ${ed.endDate}` : ""}`} onChange={(e) => { const [st, en] = e.target.value.split("—").map((x) => x.trim()); updateEducation(ed.id, { startDate: st ?? "", endDate: en ?? "" }); }} />
              </div>
            </Card>
          </SortableItem>
        ))}
      </SortableList>
    </div>
  );
}

/* ===== 技能 ===== */
function SkillsForm() {
  const { resume, addSkill, updateSkill, removeSkill, reorderSkills } = useResumeStore();
  return (
    <div>
      <ListHeader title="技能分组" onAdd={addSkill} addLabel="+ 新增分组" />
      <SortableList ids={resume.skills.map((sk) => sk.id)} onReorder={reorderSkills}>
        {resume.skills.map((sk) => (
          <SortableItem key={sk.id} id={sk.id}>
            <Card onDelete={() => removeSkill(sk.id)}>
              <input className={`w-full ${subInputCls} font-cn`} placeholder="分组名(如:技术栈)" value={sk.category} onChange={(e) => updateSkill(sk.id, { category: e.target.value })} />
              <input className={`mt-2 w-full ${subInputCls}`} placeholder="用逗号分隔,如:React, Next.js, TypeScript" value={sk.items.join(", ")} onChange={(e) => updateSkill(sk.id, { items: e.target.value.split(",") })} />
            </Card>
          </SortableItem>
        ))}
      </SortableList>
    </div>
  );
}

/* ===== 证书 ===== */
function CertificatesForm() {
  const { resume, addCertificate, updateCertificate, removeCertificate } = useResumeStore();
  return (
    <div>
      <ListHeader title="证书/资格" onAdd={addCertificate} addLabel="+ 新增证书" />
      <div className="space-y-3">
        {resume.certificates.map((c) => (
          <Card key={c.id} onDelete={() => removeCertificate(c.id)}>
            <input className={`w-full ${subInputCls} font-cn`} placeholder="证书名称" value={c.name} onChange={(e) => updateCertificate(c.id, { name: e.target.value })} />
            <div className="mt-2 grid grid-cols-2 gap-3">
              <input className={`${subInputCls} font-cn`} placeholder="颁发机构" value={c.issuer} onChange={(e) => updateCertificate(c.id, { issuer: e.target.value })} />
              <input className={subInputCls} placeholder="2022" value={c.date} onChange={(e) => updateCertificate(c.id, { date: e.target.value })} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ===== 语言 ===== */
function LanguagesForm() {
  const { resume, addLanguage, updateLanguage, removeLanguage } = useResumeStore();
  return (
    <div>
      <ListHeader title="语言能力" onAdd={addLanguage} addLabel="+ 新增语言" />
      <div className="space-y-3">
        {resume.languages.map((l) => (
          <Card key={l.id} onDelete={() => removeLanguage(l.id)}>
            <div className="grid grid-cols-2 gap-3">
              <input className={`${subInputCls} font-cn`} placeholder="语言(如:英语)" value={l.name} onChange={(e) => updateLanguage(l.id, { name: e.target.value })} />
              <input className={`${subInputCls} font-cn`} placeholder="水平(如:CET-6)" value={l.level} onChange={(e) => updateLanguage(l.id, { level: e.target.value })} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ===== 奖项 ===== */
function AwardsForm() {
  const { resume, addAward, updateAward, removeAward } = useResumeStore();
  return (
    <div>
      <ListHeader title="荣誉奖项" onAdd={addAward} addLabel="+ 新增奖项" />
      <div className="space-y-3">
        {resume.awards.map((a) => (
          <Card key={a.id} onDelete={() => removeAward(a.id)}>
            <input className={`w-full ${subInputCls} font-cn`} placeholder="奖项名称" value={a.title} onChange={(e) => updateAward(a.id, { title: e.target.value })} />
            <div className="mt-2 grid grid-cols-2 gap-3">
              <input className={`${subInputCls} font-cn`} placeholder="颁发方" value={a.issuer} onChange={(e) => updateAward(a.id, { issuer: e.target.value })} />
              <input className={subInputCls} placeholder="2023" value={a.date} onChange={(e) => updateAward(a.id, { date: e.target.value })} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ===== 共享小组件 ===== */
function ListHeader({ title, onAdd, addLabel }: { title: string; onAdd: () => void; addLabel: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <p className="text-sm font-semibold">{title}</p>
      <button onClick={onAdd} className={`rounded-md px-2 py-1 text-xs font-medium text-brand transition hover:bg-brand-soft hover:text-brand-deep ${focusRing}`}>{addLabel}</button>
    </div>
  );
}

function Card({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  return (
    <div className="group rounded-lg border border-line bg-bg-2/40 p-3.5 transition hover:border-brand-line/50 hover:shadow-sm">
      {children}
      <div className="mt-2 flex justify-end">
        <button
          onClick={onDelete}
          className={`rounded-md px-1.5 py-0.5 text-[0.65rem] text-muted opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 ${focusRing} focus-visible:opacity-100`}
        >
          删除
        </button>
      </div>
    </div>
  );
}

function SpacingIcon({ spacing }: { spacing: "compact" | "normal" | "loose" }) {
  const gap = spacing === "compact" ? 1 : spacing === "normal" ? 2.5 : 4;
  return (
    <div className="flex flex-col items-center justify-center" style={{ gap, width: 14, height: 14 }}>
      <div className="h-[1.5px] w-3 rounded-full bg-current" />
      <div className="h-[1.5px] w-3 rounded-full bg-current" />
      <div className="h-[1.5px] w-3 rounded-full bg-current" />
    </div>
  );
}
