import type { Resume } from "@/lib/schema";
import type { SectionKey } from "@/lib/store";
import { sectionMeta, hasSectionContent } from "@/lib/store";
import type { TemplateSpec } from "@/lib/template-spec";
import { SectionContent } from "@/components/resume-preview";

/**
 * SpecRenderer —— TemplateSpec(数据)的通用渲染器。
 * 预览 / 服务端导出 / 缩略图共用同一实现；只消费白名单参数，不执行任何代码。
 */

const fontMap: Record<TemplateSpec["typography"]["font"], string> = {
  sans: "var(--font-sans)",
  serif: "var(--font-serif)",
  mono: "var(--font-mono)",
};

const spaceMap: Record<TemplateSpec["section"]["density"], { section: string; item: string; pad: string }> = {
  compact: { section: "mt-3", item: "space-y-2", pad: "p-5 md:p-6" },
  normal: { section: "mt-4", item: "space-y-3", pad: "p-7 md:p-8" },
  loose: { section: "mt-6", item: "space-y-4", pad: "p-8 md:p-10" },
};

const nameScaleMap: Record<TemplateSpec["header"]["nameScale"], string> = {
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-[2.1rem] leading-tight",
};

/** 侧栏骨架里放这些模块，其余进主栏 */
const RAIL_KEYS: SectionKey[] = ["skills", "languages", "certificates", "awards"];

export function SpecRenderer({
  resume: r,
  spec,
  sectionOrder,
}: {
  resume: Resume;
  spec: TemplateSpec;
  sectionOrder: SectionKey[];
}) {
  const sp = spaceMap[spec.section.density];
  const fontCss = fontMap[spec.typography.font];
  const accent = spec.colors.accent;

  if (spec.skeleton === "sidebar-left" || spec.skeleton === "sidebar-right") {
    const railBg = spec.colors.sidebarBg || "oklch(0.975 0.004 255)";
    const railOnColor = spec.colors.sidebarBg !== ""; // 深色自定义底 → 白字
    const mainOrder = sectionOrder.filter((k) => !RAIL_KEYS.includes(k));
    const railOrder = sectionOrder.filter((k) => RAIL_KEYS.includes(k));
    const rail = (
      <div
        className={`p-5 ${railOnColor ? "text-white" : ""}`}
        style={{ width: `${spec.sidebarRatio}%`, background: railBg }}
      >
        <SpecPhoto spec={spec} resume={r} />
        <p className={`mb-1.5 text-[0.6rem] font-bold uppercase tracking-wider ${railOnColor ? "opacity-70" : "text-muted"}`}>
          联系方式
        </p>
        <div className={`space-y-1 text-[0.66rem] leading-relaxed ${railOnColor ? "opacity-90" : "text-ink-2"}`}>
          {contact(r).map((c, i) => <div key={i}>{c}</div>)}
        </div>
        {railOrder.filter((k) => hasSectionContent(r, k)).map((key) => (
          <div key={key} className="mt-4">
            <SpecSectionTitle spec={spec} sectionKey={key} onColor={railOnColor} />
            <div className={railOnColor ? "[&_*]:!text-white [&_span]:!text-white/80" : ""}>
              <SectionContent sectionKey={key} resume={r} accent={railOnColor ? "#fff" : accent} sp={{ ...sp, item: "space-y-1.5" }} />
            </div>
          </div>
        ))}
      </div>
    );
    const main = (
      <div className="flex-1 p-6">
        <SpecHeader spec={spec} resume={r} inMain />
        {r.basics.summary && (
          <p className="mt-3 text-[0.74rem] leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: r.basics.summary }} />
        )}
        <SpecSections spec={spec} resume={r} order={mainOrder} sp={sp} />
      </div>
    );
    return (
      <div className="sheet flex overflow-hidden" id="resume-sheet" style={{ fontFamily: fontCss, minHeight: 560 }}>
        {spec.skeleton === "sidebar-left" ? <>{rail}{main}</> : <>{main}{rail}</>}
      </div>
    );
  }

  // single / banner
  const isBanner = spec.skeleton === "banner";
  return (
    <div className={`sheet overflow-hidden ${isBanner ? "" : sp.pad}`} id="resume-sheet" style={{ fontFamily: fontCss }}>
      {isBanner ? (
        <>
          <div className="p-6 text-white" style={{ background: spec.colors.headerBg || accent }}>
            <SpecHeader spec={spec} resume={r} onBand />
          </div>
          <div className={sp.pad}>
            <SummaryAndSections spec={spec} resume={r} order={sectionOrder} sp={sp} />
          </div>
        </>
      ) : (
        <>
          <SpecHeader spec={spec} resume={r} />
          <SummaryAndSections spec={spec} resume={r} order={sectionOrder} sp={sp} />
        </>
      )}
    </div>
  );
}

function contact(r: Resume): string[] {
  const b = r.basics;
  return [b.email, b.phone, b.location, b.availability].filter(Boolean);
}

function SpecPhoto({ spec, resume: r }: { spec: TemplateSpec; resume: Resume }) {
  if (spec.header.photo === "none" || !r.basics.photo) return null;
  const shape = spec.header.photo === "circle" ? "rounded-full" : "rounded-lg";
  return <img src={r.basics.photo} alt="" className={`mx-auto mb-3 h-20 w-20 object-cover ${shape}`} />;
}

function SpecHeader({
  spec,
  resume: r,
  onBand,
  inMain,
}: {
  spec: TemplateSpec;
  resume: Resume;
  onBand?: boolean;
  inMain?: boolean;
}) {
  const b = r.basics;
  const centered = spec.header.align === "center";
  const nameCls = nameScaleMap[spec.header.nameScale];
  const accent = spec.colors.accent;
  const underline = spec.header.style === "underline" && !onBand;
  // band 骨架为 single 时:header 自己铺 headerBg
  const selfBand = spec.header.style === "band" && !onBand && !inMain;

  const inner = (
    <div className={centered ? "text-center" : "flex items-end justify-between gap-4"}>
      <div>
        <p className={`font-cn font-bold ${nameCls}`}>{b.name || "你的姓名"}</p>
        {b.headline && (
          <p className={`mt-1 text-[0.78rem] ${onBand || selfBand ? "opacity-85" : "text-muted"}`}>{b.headline}</p>
        )}
        {centered && (
          <div className={`mt-2 flex flex-wrap justify-center gap-x-3 text-[0.62rem] ${onBand || selfBand ? "opacity-75" : "text-faint"}`}>
            {contact(r).map((c, i) => <span key={i}>{c}</span>)}
          </div>
        )}
      </div>
      {!centered && (
        <div className={`space-y-0.5 text-right text-[0.62rem] leading-snug ${onBand || selfBand ? "opacity-75" : "text-faint"}`}>
          {contact(r).map((c, i) => <div key={i}>{c}</div>)}
        </div>
      )}
    </div>
  );

  if (selfBand) {
    return (
      <div className="-m-7 mb-0 p-6 text-white md:-m-8 md:mb-0" style={{ background: spec.colors.headerBg || accent }}>
        {inner}
      </div>
    );
  }
  return (
    <div className={underline ? "border-b-2 pb-3" : ""} style={underline ? { borderColor: accent } : undefined}>
      {inner}
    </div>
  );
}

function SpecSectionTitle({
  spec,
  sectionKey,
  onColor,
}: {
  spec: TemplateSpec;
  sectionKey: SectionKey;
  onColor?: boolean;
}) {
  const accent = spec.colors.accent;
  const title = spec.section.titleLang === "en" ? sectionMeta[sectionKey].titleEn : sectionMeta[sectionKey].title;
  const color = onColor ? undefined : accent;
  switch (spec.section.titleStyle) {
    case "underline":
      return (
        <p className={`mb-2 border-b pb-1 text-[0.66rem] font-bold uppercase tracking-wider ${onColor ? "border-white/30" : "border-line"}`} style={{ color }}>
          {title}
        </p>
      );
    case "leftbar":
      return (
        <p className="mb-2 border-l-[3px] pl-2 text-[0.66rem] font-bold tracking-wider" style={{ borderColor: onColor ? "#fff" : accent, color }}>
          {title}
        </p>
      );
    case "band":
      return (
        <p className="mb-2 rounded px-2 py-1 text-[0.64rem] font-bold tracking-wider" style={{ background: onColor ? "rgba(255,255,255,.15)" : `color-mix(in oklch, ${accent} 12%, white)`, color }}>
          {title}
        </p>
      );
    default: // caps
      return (
        <p className="mb-2 text-[0.66rem] font-bold tracking-wider" style={{ color }}>
          {title}
        </p>
      );
  }
}

function SpecSections({
  spec,
  resume: r,
  order,
  sp,
}: {
  spec: TemplateSpec;
  resume: Resume;
  order: SectionKey[];
  sp: { section: string; item: string; pad: string };
}) {
  return (
    <>
      {order.filter((k) => hasSectionContent(r, k)).map((key, idx) => (
        <div key={key} className={idx === 0 ? "mt-4" : sp.section}>
          <SpecSectionTitle spec={spec} sectionKey={key} />
          <SectionContent sectionKey={key} resume={r} accent={spec.colors.accent} sp={sp} />
        </div>
      ))}
    </>
  );
}

function SummaryAndSections({
  spec,
  resume: r,
  order,
  sp,
}: {
  spec: TemplateSpec;
  resume: Resume;
  order: SectionKey[];
  sp: { section: string; item: string; pad: string };
}) {
  return (
    <>
      {r.basics.summary && (
        <p className="mt-3 text-[0.74rem] leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: r.basics.summary }} />
      )}
      <SpecSections spec={spec} resume={r} order={order} sp={sp} />
    </>
  );
}
