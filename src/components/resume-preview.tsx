import type { Resume } from "@/lib/schema";
import type { ResumeTheme, SectionKey } from "@/lib/store";
import { sectionMeta, hasSectionContent, filled } from "@/lib/store";
import { templates } from "@/lib/templates";
import type { TemplateSpec } from "@/lib/template-spec";
import { SpecRenderer } from "@/components/spec-renderer";

const defaultTheme: ResumeTheme = {
  template: "classic",
  font: "sans",
  accent: "oklch(0.56 0.195 255)",
  spacing: "normal",
};

const defaultSectionOrder: SectionKey[] = [
  "experiences", "projects", "education", "skills", "certificates", "languages", "awards",
];

const fontMap: Record<string, string> = {
  sans: "var(--font-sans)",
  serif: "var(--font-serif)",
  mono: "var(--font-mono)",
};

const spaceMap: Record<string, { section: string; item: string; pad: string }> = {
  compact: { section: "mt-3", item: "space-y-2", pad: "p-5 md:p-6" },
  normal: { section: "mt-4", item: "space-y-3", pad: "p-7 md:p-8" },
  loose: { section: "mt-6", item: "space-y-4", pad: "p-8 md:p-10" },
};

/**
 * 简历实时预览 —— 根据 template 切换布局,按 sectionOrder 渲染模块,空模块自动隐藏。
 */
export function ResumePreview({
  resume: r,
  theme = defaultTheme,
  sectionOrder = defaultSectionOrder,
  customSpec,
}: {
  resume: Resume;
  theme?: ResumeTheme;
  sectionOrder?: SectionKey[];
  /** 自定义模板(TemplateSpec)：传入则走 SpecRenderer，忽略 theme.template */
  customSpec?: TemplateSpec;
}) {
  if (customSpec) {
    return <SpecRenderer resume={r} spec={customSpec} sectionOrder={sectionOrder} />;
  }

  const sp = spaceMap[theme.spacing] ?? spaceMap.normal;
  const fontCss = fontMap[theme.font] ?? fontMap.sans;

  const common = { resume: r, accent: theme.accent, sp, fontCss, sectionOrder };

  // 由模板 id 反查布局骨架:同一 layout 的配色/字体变体(如 metro-warm)零成本复用
  const layout = templates.find((t) => t.id === theme.template)?.layout ?? "classic";

  switch (layout) {
    case "sidebar":
      return <SidebarLayout {...common} />;
    case "banner":
      return <BannerLayout {...common} />;
    case "photo":
      return <PhotoLayout {...common} />;
    case "minimal":
      return <MinimalLayout {...common} />;
    case "timeline":
      return <TimelineLayout {...common} />;
    case "two-col":
      return <TwoColLayout {...common} />;
    case "metro":
      return <MetroLayout {...common} />;
    case "elegant":
      return <ElegantLayout {...common} />;
    case "compact":
      return <CompactLayout {...common} />;
    case "serif":
      return <SerifLayout {...common} />;
    case "dark":
      return <DarkLayout {...common} />;
    case "right-rail":
      return <RightRailLayout {...common} />;
    case "statement":
      return <StatementLayout {...common} />;
    default:
      return <ClassicLayout {...common} />;
  }
}

type LayoutProps = {
  resume: Resume;
  accent: string;
  sp: { section: string; item: string; pad: string };
  fontCss: string;
  sectionOrder: SectionKey[];
};

const stripTags = (s: string) => s.replace(/<[^>]*>/g, "");

/* ============ 1. 经典专业(单栏)============ */
function ClassicLayout({ resume: r, accent, sp, fontCss, sectionOrder }: LayoutProps) {
  const b = r.basics;
  return (
    <div className={`sheet ${sp.pad}`} id="resume-sheet" style={{ fontFamily: fontCss }}>
      <Header name={b.name} headline={b.headline} contact={[b.email, b.phone, b.location, b.availability]} accent={accent} />
      {b.summary && <p className="mt-3 text-[0.74rem] leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: b.summary }} />}
      <Sections resume={r} accent={accent} sp={sp} order={sectionOrder} />
    </div>
  );
}

/* ============ 2. 商务侧栏(左色块侧栏 + 右主内容)============ */
function SidebarLayout({ resume: r, accent, sp, fontCss, sectionOrder }: LayoutProps) {
  const b = r.basics;
  return (
    <div className="sheet flex overflow-hidden" id="resume-sheet" style={{ fontFamily: fontCss, minHeight: "560px" }}>
      <div className="w-[36%] p-6 text-white" style={{ background: accent }}>
        {b.photo ? (
          <img src={b.photo} alt="" className="mx-auto h-20 w-20 rounded-full object-cover ring-2 ring-white/30" />
        ) : (
          <div className="mx-auto h-20 w-20 rounded-full bg-white/20" />
        )}
        <p className="mt-3 font-cn text-xl font-bold">{b.name || "你的姓名"}</p>
        {b.headline && <p className="mt-1 text-[0.72rem] opacity-90">{b.headline}</p>}
        <div className="mt-5 space-y-0.5 text-[0.62rem] leading-relaxed opacity-85">
          {[b.email, b.phone, b.location, b.availability].filter(Boolean).map((c, i) => <div key={i}>{c}</div>)}
        </div>
        {hasSectionContent(r, "skills") && (
          <div className="mt-6">
            <p className="mb-2 text-[0.62rem] font-bold tracking-wider opacity-70">技 能</p>
            <div className="space-y-1.5">
              {r.skills.filter((sk) => sk.items.some(filled)).map((sk) => (
                <div key={sk.id} className="text-[0.7rem]">
                  {sk.category && <span className="font-semibold">{sk.category}: </span>}
                  <span className="opacity-90">{sk.items.filter(filled).join(" · ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 p-6">
        {b.summary && <p className="mb-4 text-[0.74rem] leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: b.summary }} />}
        <Sections resume={r} accent="#666" sp={sp} order={sectionOrder.filter((k) => k !== "skills")} />
      </div>
    </div>
  );
}

/* ============ 3. 顶部色块(banner 横条 + 下方内容)============ */
function BannerLayout({ resume: r, accent, sp, fontCss, sectionOrder }: LayoutProps) {
  const b = r.basics;
  return (
    <div className="sheet overflow-hidden" id="resume-sheet" style={{ fontFamily: fontCss }}>
      <div className="p-6 text-white" style={{ background: accent }}>
        <p className="font-cn text-2xl font-bold">{b.name || "你的姓名"}</p>
        {b.headline && <p className="mt-1 text-[0.82rem] opacity-90">{b.headline}</p>}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[0.64rem] opacity-80">
          {[b.email, b.phone, b.location, b.availability].filter(Boolean).map((c, i) => <span key={i}>{c}</span>)}
        </div>
      </div>
      <div className={sp.pad}>
        {b.summary && <p className="mb-4 text-[0.74rem] leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: b.summary }} />}
        <Sections resume={r} accent={accent} sp={sp} order={sectionOrder} />
      </div>
    </div>
  );
}

/* ============ 3b. 证件照(左侧照片 + 右侧主内容)============ */
function PhotoLayout({ resume: r, accent, sp, fontCss, sectionOrder }: LayoutProps) {
  const b = r.basics;
  return (
    <div className={`sheet ${sp.pad}`} id="resume-sheet" style={{ fontFamily: fontCss }}>
      <div className="flex items-start gap-5 border-b-2 pb-4" style={{ borderColor: accent }}>
        {b.photo ? (
          <img src={b.photo} alt="" className="h-24 w-20 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded-lg border border-line bg-bg-2 text-[0.6rem] text-faint">照片</div>
        )}
        <div className="flex-1">
          <p className="font-cn text-2xl font-bold">{b.name || "你的姓名"}</p>
          {b.headline && <p className="mt-0.5 text-[0.78rem] text-muted">{b.headline}</p>}
          <div className="mt-2 flex flex-wrap gap-x-4 text-[0.62rem] text-faint">
            {[b.email, b.phone, b.location, b.availability].filter(Boolean).map((c, i) => <span key={i}>{c}</span>)}
          </div>
        </div>
      </div>
      {b.summary && <p className="mt-3 text-[0.74rem] leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: b.summary }} />}
      <Sections resume={r} accent={accent} sp={sp} order={sectionOrder} />
    </div>
  );
}

/* ============ 4. 极简留白 ============ */
function MinimalLayout({ resume: r, accent, sp, fontCss, sectionOrder }: LayoutProps) {
  const b = r.basics;
  return (
    <div className={`sheet ${sp.pad}`} id="resume-sheet" style={{ fontFamily: fontCss }}>
      <p className="text-lg font-light tracking-wide text-ink">{b.name || "你的姓名"}</p>
      {b.headline && <p className="mt-0.5 text-[0.66rem] uppercase tracking-[0.2em] text-muted">{b.headline}</p>}
      <div className="mt-2 flex flex-wrap gap-x-3 text-[0.62rem] text-faint">
        {[b.email, b.phone, b.location, b.availability].filter(Boolean).map((c, i) => <span key={i}>{c} </span>)}
      </div>
      <div className="mt-4 h-px bg-line" />
      {b.summary && <p className="mt-4 text-[0.74rem] leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: b.summary }} />}
      <Sections resume={r} accent={accent} sp={sp} order={sectionOrder} minimal />
    </div>
  );
}

/* ============ 5. 时间轴(左侧竖线 + 节点)============ */
function TimelineLayout({ resume: r, accent, sp, fontCss, sectionOrder }: LayoutProps) {
  const b = r.basics;
  return (
    <div className={`sheet ${sp.pad}`} id="resume-sheet" style={{ fontFamily: fontCss }}>
      <Header name={b.name} headline={b.headline} contact={[b.email, b.phone, b.location, b.availability]} accent={accent} />
      {b.summary && <p className="mt-3 text-[0.74rem] leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: b.summary }} />}
      <Sections resume={r} accent={accent} sp={sp} order={sectionOrder} timeline />
    </div>
  );
}

/* ============ 6. 现代双栏 ============ */
function TwoColLayout({ resume: r, accent, sp, fontCss, sectionOrder }: LayoutProps) {
  const b = r.basics;
  return (
    <div className={`sheet ${sp.pad}`} id="resume-sheet" style={{ fontFamily: fontCss }}>
      <div className="flex items-end justify-between border-b border-line pb-3">
        <div>
          <p className="font-cn text-2xl font-bold">{b.name || "你的姓名"}</p>
          {b.headline && <p className="mt-0.5 text-[0.78rem] text-muted">{b.headline}</p>}
        </div>
        <div className="space-y-0.5 text-right text-[0.62rem] text-faint">
          {[b.email, b.phone, b.location, b.availability].filter(Boolean).map((c, i) => <div key={i}>{c}</div>)}
        </div>
      </div>
      {b.summary && <p className="mt-3 text-[0.74rem] leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: b.summary }} />}
      <Sections resume={r} accent={accent} sp={sp} order={sectionOrder} />
    </div>
  );
}

/* ============ 7. 网格卡片(Metro)============ */
function MetroLayout({ resume: r, accent, sp, fontCss, sectionOrder }: LayoutProps) {
  const b = r.basics;
  const visibleSections = sectionOrder.filter((k) => hasSectionContent(r, k));
  return (
    <div className="sheet p-5" id="resume-sheet" style={{ fontFamily: fontCss }}>
      <div className="rounded-lg border border-line p-4" style={{ borderTopColor: accent, borderTopWidth: 3 }}>
        <p className="font-cn text-2xl font-bold">{b.name || "你的姓名"}</p>
        {b.headline && <p className="mt-0.5 text-[0.78rem] text-muted">{b.headline}</p>}
        <div className="mt-2 flex flex-wrap gap-x-4 text-[0.62rem] text-faint">
          {[b.email, b.phone, b.location, b.availability].filter(Boolean).map((c, i) => <span key={i}>{c}</span>)}
        </div>
        {b.summary && <p className="mt-2.5 text-[0.74rem] leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: b.summary }} />}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {visibleSections.map((key) => {
          const isWide = key === "experiences" || key === "projects";
          return (
            <div key={key} className={`rounded-lg border border-line p-3.5 ${isWide ? "col-span-2" : ""}`}>
              <p className="mb-2 text-[0.64rem] font-bold tracking-wider" style={{ color: accent }}>{sectionMeta[key].title}</p>
              <SectionContent sectionKey={key} resume={r} accent={accent} sp={sp} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ 8. 优雅典线(Elegant)============ */
function ElegantLayout({ resume: r, accent, sp, fontCss, sectionOrder }: LayoutProps) {
  const b = r.basics;
  return (
    <div className={`sheet ${sp.pad}`} id="resume-sheet" style={{ fontFamily: fontCss }}>
      <div className="text-center">
        <p className="font-cn text-2xl font-bold">{b.name || "你的姓名"}</p>
        {b.headline && <p className="mt-1 text-[0.78rem] text-muted">{b.headline}</p>}
        <div className="mt-2.5 flex items-center justify-center gap-2">
          <div className="h-px w-10" style={{ background: accent }} />
          <div className="h-1.5 w-1.5 rotate-45" style={{ background: accent }} />
          <div className="h-px w-10" style={{ background: accent }} />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 text-[0.62rem] text-faint">
          {[b.email, b.phone, b.location, b.availability].filter(Boolean).map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span style={{ color: accent }}>·</span>}
              {c}
            </span>
          ))}
        </div>
      </div>
      {b.summary && (
        <>
          <Ornament accent={accent} />
          <p className="text-center text-[0.74rem] leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: b.summary }} />
        </>
      )}
      {sectionOrder.filter((k) => hasSectionContent(r, k)).map((key) => (
        <div key={key}>
          <Ornament accent={accent} />
          <p className="mb-2 text-center text-[0.64rem] font-bold tracking-[0.15em]" style={{ color: accent }}>{sectionMeta[key].titleEn}</p>
          <SectionContent sectionKey={key} resume={r} accent={accent} sp={sp} />
        </div>
      ))}
    </div>
  );
}

function Ornament({ accent }: { accent: string }) {
  return (
    <div className="my-4 flex items-center justify-center gap-2">
      <div className="h-px flex-1 bg-line" />
      <div className="h-1.5 w-1.5 rotate-45" style={{ background: accent }} />
      <div className="h-px flex-1 bg-line" />
    </div>
  );
}

/* ============ 9. 信息密集(Compact)============ */
function CompactLayout({ resume: r, accent, sp, fontCss, sectionOrder }: LayoutProps) {
  const b = r.basics;
  const sideKeys: SectionKey[] = ["skills", "languages", "certificates"];
  const mainKeys = sectionOrder.filter((k) => !sideKeys.includes(k));
  const sideOrder = sectionOrder.filter((k) => sideKeys.includes(k));
  return (
    <div className="sheet" id="resume-sheet" style={{ fontFamily: fontCss }}>
      <div className="border-b-2 px-5 py-3" style={{ borderColor: accent }}>
        <div className="flex items-end justify-between">
          <div>
            <p className="font-cn text-xl font-bold">{b.name || "你的姓名"}</p>
            {b.headline && <p className="text-[0.72rem] text-muted">{b.headline}</p>}
          </div>
          <div className="flex flex-wrap gap-x-3 text-[0.6rem] text-faint">
            {[b.email, b.phone, b.location, b.availability].filter(Boolean).map((c, i) => <span key={i}>{c}</span>)}
          </div>
        </div>
      </div>
      <div className="flex" style={{ minHeight: 480 }}>
        <div className="flex-1 p-5">
          {b.summary && <p className="mb-3 text-[0.72rem] leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: b.summary }} />}
          {mainKeys.filter((k) => hasSectionContent(r, k)).map((key, i) => (
            <div key={key} className={i > 0 ? "mt-3" : ""}>
              <p className="mb-1.5 text-[0.6rem] font-bold tracking-wider" style={{ color: accent }}>{sectionMeta[key].title}</p>
              <SectionContent sectionKey={key} resume={r} accent={accent} sp={{ ...sp, item: "space-y-2" }} />
            </div>
          ))}
        </div>
        <div className="w-[30%] border-l border-line p-4">
          {sideOrder.filter((k) => hasSectionContent(r, k)).map((key, i) => (
            <div key={key} className={i > 0 ? "mt-3" : ""}>
              <p className="mb-1.5 text-[0.6rem] font-bold tracking-wider" style={{ color: accent }}>{sectionMeta[key].title}</p>
              <SectionContent sectionKey={key} resume={r} accent={accent} sp={{ ...sp, item: "space-y-1.5" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ 10. 学院衬线(居中正式,Harvard 风)============ */
function SerifLayout({ resume: r, accent, sp, sectionOrder }: LayoutProps) {
  const b = r.basics;
  return (
    <div className={`sheet ${sp.pad}`} id="resume-sheet" style={{ fontFamily: "var(--font-serif)" }}>
      <div className="text-center">
        <p className="font-cn text-[1.7rem] font-bold tracking-[0.08em]">{b.name || "你的姓名"}</p>
        {b.headline && <p className="mt-1 text-[0.76rem] tracking-wide text-muted">{b.headline}</p>}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 text-[0.62rem] text-faint">
          {[b.email, b.phone, b.location, b.availability].filter(Boolean).map((c, i) => (
            <span key={i}>{i > 0 && <span className="mr-3">|</span>}{c}</span>
          ))}
        </div>
      </div>
      {/* 双细线:学院正式感 */}
      <div className="mt-3 border-b-2" style={{ borderColor: accent }} />
      <div className="mt-[2px] border-b border-line" />
      {b.summary && <p className="mt-4 text-[0.74rem] leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: b.summary }} />}
      {sectionOrder.filter((k) => hasSectionContent(r, k)).map((key, idx) => (
        <div key={key} className={idx === 0 && !b.summary ? "mt-4" : sp.section}>
          <p className="mb-2 border-b border-line pb-1 text-[0.66rem] font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>
            {sectionMeta[key].titleEn}
          </p>
          <SectionContent sectionKey={key} resume={r} accent={accent} sp={sp} />
        </div>
      ))}
    </div>
  );
}

/* ============ 11. 深色高管(深色 header + 纸面正文)============ */
function DarkLayout({ resume: r, accent, sp, fontCss, sectionOrder }: LayoutProps) {
  const b = r.basics;
  return (
    <div className="sheet overflow-hidden" id="resume-sheet" style={{ fontFamily: fontCss }}>
      <div className="px-7 py-6 text-white" style={{ background: "oklch(0.23 0.02 255)" }}>
        <div className="flex items-end justify-between">
          <div>
            <p className="font-cn text-2xl font-bold tracking-wide">{b.name || "你的姓名"}</p>
            {b.headline && <p className="mt-1 text-[0.78rem] opacity-80">{b.headline}</p>}
          </div>
          <div className="space-y-0.5 text-right text-[0.62rem] leading-relaxed opacity-70">
            {[b.email, b.phone, b.location, b.availability].filter(Boolean).map((c, i) => <div key={i}>{c}</div>)}
          </div>
        </div>
        <div className="mt-4 h-[2px] w-14" style={{ background: accent }} />
      </div>
      <div className={sp.pad}>
        {b.summary && <p className="mb-4 text-[0.74rem] leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: b.summary }} />}
        <Sections resume={r} accent={accent} sp={sp} order={sectionOrder} />
      </div>
    </div>
  );
}

/* ============ 12. 右栏简约(主内容 + 右侧浅灰栏)============ */
function RightRailLayout({ resume: r, accent, sp, fontCss, sectionOrder }: LayoutProps) {
  const b = r.basics;
  const railKeys: SectionKey[] = ["skills", "languages", "certificates", "awards"];
  const mainOrder = sectionOrder.filter((k) => !railKeys.includes(k));
  const railOrder = sectionOrder.filter((k) => railKeys.includes(k));
  return (
    <div className="sheet flex overflow-hidden" id="resume-sheet" style={{ fontFamily: fontCss, minHeight: 560 }}>
      <div className="flex-1 p-6">
        <p className="font-cn text-2xl font-bold">{b.name || "你的姓名"}</p>
        {b.headline && <p className="mt-0.5 text-[0.78rem]" style={{ color: accent }}>{b.headline}</p>}
        {b.summary && <p className="mt-3 text-[0.74rem] leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: b.summary }} />}
        <div className="mt-4">
          <Sections resume={r} accent={accent} sp={sp} order={mainOrder} />
        </div>
      </div>
      <div className="w-[31%] p-5" style={{ background: "oklch(0.975 0.004 255)" }}>
        <p className="mb-1.5 text-[0.6rem] font-bold uppercase tracking-wider text-muted">联系方式</p>
        <div className="space-y-1 text-[0.66rem] leading-relaxed text-ink-2">
          {[b.email, b.phone, b.location, b.availability].filter(Boolean).map((c, i) => <div key={i}>{c}</div>)}
        </div>
        {railOrder.filter((k) => hasSectionContent(r, k)).map((key) => (
          <div key={key} className="mt-4">
            <p className="mb-1.5 text-[0.6rem] font-bold tracking-wider" style={{ color: accent }}>{sectionMeta[key].title}</p>
            <SectionContent sectionKey={key} resume={r} accent={accent} sp={{ ...sp, item: "space-y-1.5" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ 13. 大字标题(Statement,超大姓名 + 粗短下划线)============ */
function StatementLayout({ resume: r, accent, sp, fontCss, sectionOrder }: LayoutProps) {
  const b = r.basics;
  return (
    <div className={`sheet ${sp.pad}`} id="resume-sheet" style={{ fontFamily: fontCss }}>
      <p className="font-cn text-[2.3rem] font-black leading-tight tracking-tight">{b.name || "你的姓名"}</p>
      <div className="mt-1.5 h-[5px] w-16" style={{ background: accent }} />
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        {b.headline && <p className="text-[0.82rem] font-medium text-ink-2">{b.headline}</p>}
        <div className="flex flex-wrap gap-x-3 text-[0.62rem] text-faint">
          {[b.email, b.phone, b.location, b.availability].filter(Boolean).map((c, i) => <span key={i}>{c}</span>)}
        </div>
      </div>
      {b.summary && <p className="mt-4 text-[0.74rem] leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: b.summary }} />}
      <Sections resume={r} accent={accent} sp={sp} order={sectionOrder} />
    </div>
  );
}

/* ============ 统一模块渲染器:按 order 渲染,跳过空模块 ============ */
function Sections({
  resume: r,
  accent,
  sp,
  order,
  minimal,
  timeline,
}: {
  resume: Resume;
  accent: string;
  sp: { section: string; item: string; pad: string };
  order: SectionKey[];
  minimal?: boolean;
  timeline?: boolean;
}) {
  return (
    <>
      {order.filter((k) => hasSectionContent(r, k)).map((key, idx) => {
        const meta = sectionMeta[key];
        const title = minimal ? meta.titleEn : meta.title;
        const mt = idx === 0 ? "" : sp.section;
        return (
          <Section key={key} title={title} accent={accent} mt={mt} minimal={minimal}>
            <SectionContent sectionKey={key} resume={r} accent={accent} sp={sp} timeline={timeline} />
          </Section>
        );
      })}
    </>
  );
}

export function SectionContent({
  sectionKey,
  resume: r,
  accent,
  sp,
  timeline,
}: {
  sectionKey: SectionKey;
  resume: Resume;
  accent: string;
  sp: { section: string; item: string; pad: string };
  timeline?: boolean;
}) {
  switch (sectionKey) {
    case "experiences":
      if (timeline) {
        return (
          <div className="relative mt-1 pl-4">
            <div className="absolute bottom-0 left-[3px] top-1 w-px" style={{ background: accent }} />
            <div className={`${sp.item} relative`}>
              {r.experiences.map((e) => (
                <div key={e.id} className="relative">
                  <div className="absolute -left-[17px] top-1 h-2 w-2 rounded-full" style={{ background: accent }} />
                  <ExpItem e={e} accent={accent} />
                </div>
              ))}
            </div>
          </div>
        );
      }
      return <div className={sp.item}>{r.experiences.map((e) => <ExpItem key={e.id} e={e} accent={accent} />)}</div>;
    case "projects":
      return <div className={sp.item}>{r.projects.map((p) => <ProjectItem key={p.id} p={p} accent={accent} />)}</div>;
    case "education":
      return <div className="space-y-1.5">{r.education.map((ed) => <EduItem key={ed.id} ed={ed} />)}</div>;
    case "skills":
      return <div className="space-y-1.5">{r.skills.filter((s) => s.items.some(filled)).map((s) => <SkillItem key={s.id} s={s} />)}</div>;
    case "certificates":
      return <div className="space-y-1">{r.certificates.filter((c) => c.name).map((c) => <SimpleItem key={c.id} left={c.name} right={`${c.issuer}${c.date ? ` · ${c.date}` : ""}`} />)}</div>;
    case "languages":
      return <div className="space-y-1">{r.languages.filter((l) => l.name).map((l) => <SimpleItem key={l.id} left={l.name} right={l.level} />)}</div>;
    case "awards":
      return <div className="space-y-1">{r.awards.filter((a) => a.title).map((a) => <SimpleItem key={a.id} left={a.title} right={`${a.issuer}${a.date ? ` · ${a.date}` : ""}`} />)}</div>;
    default:
      return null;
  }
}

/* ============ 共享子组件 ============ */

function Header({ name, headline, contact, accent }: {
  name: string; headline: string; contact: string[]; accent: string;
}) {
  return (
    <div className="flex items-start justify-between border-b-2 pb-3" style={{ borderColor: accent }}>
      <div>
        <p className="font-cn text-2xl font-bold">{name || "你的姓名"}</p>
        {headline && <p className="mt-0.5 text-[0.78rem] text-muted">{headline}</p>}
      </div>
      <div className="text-right text-[0.62rem] leading-snug text-faint">
        {contact.filter(Boolean).map((c, i) => <div key={i}>{c}</div>)}
      </div>
    </div>
  );
}

function Section({ title, accent, mt, children, minimal }: {
  title: string; accent: string; mt: string; children: React.ReactNode; minimal?: boolean;
}) {
  return (
    <div className={mt}>
      <p className={`mb-2 ${minimal ? "text-[0.6rem] uppercase tracking-[0.18em] text-muted" : "text-[0.66rem] font-bold tracking-wider"}`} style={{ color: minimal ? undefined : accent }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function ExpItem({ e, accent }: { e: Resume["experiences"][number]; accent: string }) {
  return (
    <div>
      <div className="flex justify-between text-[0.8rem]">
        <span className="font-semibold">
          {e.company}
          {e.position && <span className="font-normal text-muted"> · {e.position}</span>}
        </span>
        <span className="text-[0.66rem] text-faint">{e.startDate}{e.current ? " — 至今" : e.endDate ? ` — ${e.endDate}` : ""}</span>
      </div>
      <ul className="mt-1 space-y-0.5">
        {e.bullets.filter(filled).map((bl, i) => (
          <li key={i} className="flex gap-1.5 text-[0.74rem] leading-relaxed text-ink-2">
            <span style={{ color: accent }}>·</span>
            <span dangerouslySetInnerHTML={{ __html: bl }} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProjectItem({ p, accent }: { p: Resume["projects"][number]; accent: string }) {
  return (
    <div>
      <div className="flex justify-between text-[0.8rem]">
        <span className="font-semibold">
          {p.name}
          {p.role && <span className="font-normal text-muted"> · {p.role}</span>}
        </span>
        {p.link && <span className="text-[0.62rem] text-faint">{p.link}</span>}
      </div>
      <ul className="mt-1 space-y-0.5">
        {p.bullets.filter(filled).map((bl, i) => (
          <li key={i} className="flex gap-1.5 text-[0.74rem] leading-relaxed text-ink-2">
            <span style={{ color: accent }}>·</span>
            <span dangerouslySetInnerHTML={{ __html: bl }} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function EduItem({ ed }: { ed: Resume["education"][number] }) {
  return (
    <div className="flex justify-between text-[0.8rem]">
      <span>
        <span className="font-semibold">{ed.school}</span>
        {ed.major && <span className="text-muted"> · {ed.major}{ed.degree && ` · ${ed.degree}`}</span>}
      </span>
      <span className="text-[0.66rem] text-faint">{ed.startDate}{ed.endDate ? ` — ${ed.endDate}` : ""}</span>
    </div>
  );
}

function SkillItem({ s }: { s: Resume["skills"][number] }) {
  return (
    <div className="text-[0.76rem]">
      {s.category && <span className="font-semibold">{s.category}: </span>}
      <span className="text-ink-2">{s.items.filter(filled).join(" · ")}</span>
    </div>
  );
}

function SimpleItem({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex justify-between text-[0.76rem]">
      <span className="font-medium">{left}</span>
      {right && <span className="text-faint">{right}</span>}
    </div>
  );
}
