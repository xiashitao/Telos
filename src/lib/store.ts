import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Resume } from "./schema";

const uid = () => Math.random().toString(36).slice(2, 9);

/** 模块定义 —— 每个模块有 key/标题,顺序由 sectionOrder 控制 */
export type SectionKey =
  | "experiences"
  | "projects"
  | "education"
  | "skills"
  | "certificates"
  | "languages"
  | "awards";

export const sectionMeta: Record<SectionKey, { title: string; titleEn: string }> = {
  experiences: { title: "经 历", titleEn: "EXPERIENCE" },
  projects: { title: "项 目", titleEn: "PROJECTS" },
  education: { title: "教 育", titleEn: "EDUCATION" },
  skills: { title: "技 能", titleEn: "SKILLS" },
  certificates: { title: "证 书", titleEn: "CERTIFICATES" },
  languages: { title: "语 言", titleEn: "LANGUAGES" },
  awards: { title: "奖 项", titleEn: "AWARDS" },
};

const defaultSectionOrder: SectionKey[] = [
  "experiences",
  "projects",
  "education",
  "skills",
  "certificates",
  "languages",
  "awards",
];

/** 默认示例数据 */
/** 默认示例数据（也用作分享模板的预览数据） */
export const defaultResume: Resume = {
  basics: {
    name: "陈墨白",
    headline: "高级前端工程师 · 7 年经验 · 架构 & 性能优化方向",
    email: "mobai@telos.cv",
    phone: "138 0000 0000",
    location: "杭州",
    availability: "在职,随时可面试",
    summary: "七年前端开发经验,专精大型 Web 应用架构设计与性能优化。曾主导日活千万级电商平台的前端架构重构,首屏加载提速 70%;搭建企业级组件库与 Lowcode 平台,服务 200+ 业务页面。具备从 0 到 1 的产品落地能力与跨团队协作经验,擅长用技术手段驱动业务增长。",
    photo: "",
  },
  experiences: [
    {
      id: uid(),
      company: "某里巴巴",
      position: "高级前端工程师(P7)",
      startDate: "2021.03",
      endDate: "",
      current: true,
      bullets: [
        "<p>主导电商平台前端架构重构,引入微前端 + SSR 方案,<strong>首屏加载从 3.8s 降至 1.1s</strong>,核心页面转化率提升 14%,年贡献 GMV 增量约 2 亿。</p>",
        "<p>从零搭建企业级组件库(80+ 组件)与 Lowcode 搭建平台,<strong>支撑 200+ 业务页面</strong>,研发人效提升 40%,非技术运营可独立搭建活动页,节省设计师排期 60%。</p>",
        "<p>推动前端监控体系落地(错误采集 + 性能埋点 + 告警),线上 P0 故障发现时间从 30min 缩短至 <strong>3min 内自动告警</strong>,故障恢复效率提升 5 倍。</p>",
      ],
    },
    {
      id: uid(),
      company: "某节跳动",
      position: "前端工程师",
      startDate: "2018.07",
      endDate: "2021.02",
      current: false,
      bullets: [
        "<p>负责在线文档协同编辑核心模块,基于 CRDT 实现实时多人编辑,<strong>支撑万人并发、延迟 < 100ms</strong>,用户满意度评分 4.8/5。</p>",
        "<p>主导性能监控 SDK 从立项到上线,覆盖 Web/小程序双端,接入 50+ 业务线,<strong>线上卡顿率下降 63%</strong>,FCP 均值优化 42%。</p>",
        "<p>推动团队工程化升级:统一 Monorepo + CI/CD 流水线,构建时间从 8min 降至 2min,MR 合入效率提升 3 倍。</p>",
      ],
    },
    {
      id: uid(),
      company: "某讯科技",
      position: "前端开发工程师",
      startDate: "2016.07",
      endDate: "2018.06",
      current: false,
      bullets: [
        "<p>参与社交产品 IM 模块开发,负责消息列表虚拟滚动与富媒体渲染,<strong>万级消息流畅滚动,内存占用降低 55%</strong>。</p>",
        "<p>独立完成 H5 活动页搭建系统 MVP,支持拖拽编辑 + 模板复用,运营团队活动上线周期从 3 天缩短至 <strong>2 小时</strong>。</p>",
      ],
    },
  ],
  projects: [
    {
      id: uid(),
      name: "Telos 智能简历",
      role: "全栈独立开发",
      link: "github.com/example/telos",
      bullets: ["<p>基于 Next.js 16 + Tailwind CSS + Zustand 构建的 AI 简历生成器,集成 Claude AI 实现经历润色与 JD 关键词匹配。支持 6 种专业模板、实时预览、拖拽排序、一键导出 PDF,<strong>上线一周 GitHub 500+ Star</strong>。</p>"],
    },
    {
      id: uid(),
      name: "前端性能监控平台",
      role: "核心开发 & 架构设计",
      link: "",
      bullets: ["<p>自研轻量级前端监控 SDK(gzip 后仅 8KB),支持 FCP/LCP/CLS 等核心指标采集、JS 错误堆栈还原、用户行为录屏回放。<strong>日均处理 5 亿+ 埋点事件</strong>,P99 查询延迟 < 200ms。</p>"],
    },
    {
      id: uid(),
      name: "企业级组件库 AntX",
      role: "技术负责人",
      link: "",
      bullets: ["<p>基于 Ant Design 二次封装的业务组件库,包含 80+ 组件,覆盖表单、表格、图表、权限等场景。<strong>NPM 周下载量 12K+</strong>,配套完善的文档站 + Storybook + 单元测试(覆盖率 92%)。</p>"],
    },
  ],
  education: [
    {
      id: uid(),
      school: "浙江大学",
      degree: "学士",
      major: "计算机科学与技术",
      startDate: "2012",
      endDate: "2016",
    },
  ],
  skills: [
    {
      id: uid(),
      category: "前端框架",
      items: ["React", "Next.js", "Vue 3", "Svelte"],
    },
    {
      id: uid(),
      category: "语言 & 工具",
      items: ["TypeScript", "JavaScript", "Node.js", "Webpack", "Vite", "Turbopack"],
    },
    {
      id: uid(),
      category: "架构能力",
      items: ["微前端", "SSR/SSG", "Monorepo", "前端监控", "Lowcode", "性能优化"],
    },
    {
      id: uid(),
      category: "其他",
      items: ["Docker", "CI/CD", "GraphQL", "WebSocket", "CRDT", "Figma"],
    },
  ],
  certificates: [
    { id: uid(), name: "PMP 项目管理专业认证", issuer: "PMI", date: "2022" },
    { id: uid(), name: "AWS Certified Solutions Architect", issuer: "Amazon", date: "2023" },
  ],
  languages: [
    { id: uid(), name: "英语", level: "CET-6 / 流利读写,可英文技术面试" },
    { id: uid(), name: "普通话", level: "母语" },
  ],
  awards: [
    { id: uid(), title: "年度技术之星", issuer: "某里巴巴", date: "2023" },
    { id: uid(), title: "最佳创新项目奖(性能监控平台)", issuer: "某节跳动", date: "2020" },
    { id: uid(), title: "ACM 区域赛银牌", issuer: "ACM/ICPC", date: "2015" },
  ],
};

export interface ResumeTheme {
  template: string;
  font: string;
  accent: string;
  spacing: "compact" | "normal" | "loose";
}

export const themePresets = {
  templates: [
    { id: "classic", label: "经典专业" },
    { id: "sidebar", label: "商务侧栏" },
    { id: "banner", label: "顶部色块" },
    { id: "minimal", label: "极简留白" },
    { id: "timeline", label: "时间轴" },
    { id: "two-col", label: "现代双栏" },
    { id: "metro", label: "网格卡片" },
    { id: "metro-warm", label: "暖调卡片" },
    { id: "metro-teal", label: "清新卡片" },
    { id: "elegant", label: "优雅典线" },
    { id: "elegant-rose", label: "玫瑰典雅" },
    { id: "compact", label: "信息密集" },
    { id: "compact-dark", label: "干练紧凑" },
  ],
  fonts: [
    { id: "sans", label: "无衬线", css: "var(--font-sans)" },
    { id: "serif", label: "衬线宋体", css: "var(--font-serif)" },
    { id: "mono", label: "等宽", css: "var(--font-mono)" },
  ],
  accents: [
    { id: "brand", label: "专业蓝", value: "oklch(0.56 0.195 255)" },
    { id: "deep", label: "深墨蓝", value: "oklch(0.44 0.19 257)" },
    { id: "warm", label: "暖橙", value: "oklch(0.62 0.16 45)" },
    { id: "purple", label: "学院紫", value: "oklch(0.52 0.14 305)" },
    { id: "green", label: "森林绿", value: "oklch(0.58 0.13 150)" },
    { id: "ink", label: "墨黑", value: "oklch(0.20 0.012 250)" },
  ],
  spacings: [
    { id: "compact", label: "紧凑" },
    { id: "normal", label: "标准" },
    { id: "loose", label: "宽松" },
  ],
} as const;

const defaultTheme: ResumeTheme = {
  template: "classic",
  font: "sans",
  accent: "oklch(0.56 0.195 255)",
  spacing: "normal",
};

/** 通用数组 CRUD 工厂 */
function arrayCrud<T extends { id: string }>(list: T[]) {
  return {
    add: (item: T) => [...list, item],
    update: (id: string, patch: Partial<T>) =>
      list.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    remove: (id: string) => list.filter((it) => it.id !== id),
    reorder: (from: number, to: number) => {
      const next = [...list];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    },
  };
}

interface ResumeStore {
  resume: Resume;
  sectionOrder: SectionKey[];
  theme: ResumeTheme;
  _onePageSnapshot: { resume: Resume; theme: ResumeTheme } | null;
  setTheme: (patch: Partial<ResumeTheme>) => void;
  setBasics: (patch: Partial<Resume["basics"]>) => void;
  setResume: (resume: Resume) => void;
  reorderSections: (from: number, to: number) => void;
  saveOnePageSnapshot: () => void;
  revertOnePage: () => void;
  clearOnePageSnapshot: () => void;
  // experiences
  addExperience: () => void;
  updateExperience: (id: string, patch: Partial<Resume["experiences"][number]>) => void;
  removeExperience: (id: string) => void;
  reorderExperiences: (from: number, to: number) => void;
  // projects
  addProject: () => void;
  updateProject: (id: string, patch: Partial<Resume["projects"][number]>) => void;
  removeProject: (id: string) => void;
  reorderProjects: (from: number, to: number) => void;
  // education
  addEducation: () => void;
  updateEducation: (id: string, patch: Partial<Resume["education"][number]>) => void;
  removeEducation: (id: string) => void;
  reorderEducation: (from: number, to: number) => void;
  // skills
  addSkill: () => void;
  updateSkill: (id: string, patch: Partial<Resume["skills"][number]>) => void;
  removeSkill: (id: string) => void;
  reorderSkills: (from: number, to: number) => void;
  // certificates
  addCertificate: () => void;
  updateCertificate: (id: string, patch: Partial<Resume["certificates"][number]>) => void;
  removeCertificate: (id: string) => void;
  // languages
  addLanguage: () => void;
  updateLanguage: (id: string, patch: Partial<Resume["languages"][number]>) => void;
  removeLanguage: (id: string) => void;
  // awards
  addAward: () => void;
  updateAward: (id: string, patch: Partial<Resume["awards"][number]>) => void;
  removeAward: (id: string) => void;
  reset: () => void;
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set) => ({
      resume: defaultResume,
      sectionOrder: defaultSectionOrder,
      theme: defaultTheme,
      _onePageSnapshot: null,
      setTheme: (patch) => set((s) => ({ theme: { ...s.theme, ...patch } })),
      setBasics: (patch) =>
        set((s) => ({ resume: { ...s.resume, basics: { ...s.resume.basics, ...patch } } })),
      setResume: (resume) => set({ resume }),

      saveOnePageSnapshot: () =>
        set((s) => ({ _onePageSnapshot: { resume: JSON.parse(JSON.stringify(s.resume)), theme: { ...s.theme } } })),
      revertOnePage: () =>
        set((s) => s._onePageSnapshot ? { resume: s._onePageSnapshot.resume, theme: s._onePageSnapshot.theme, _onePageSnapshot: null } : {}),
      clearOnePageSnapshot: () => set({ _onePageSnapshot: null }),

      reorderSections: (from, to) =>
        set((s) => {
          const next = [...s.sectionOrder];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          return { sectionOrder: next };
        }),

      // ===== experiences =====
      addExperience: () =>
        set((s) => ({
          resume: {
            ...s.resume,
            experiences: [...s.resume.experiences, { id: uid(), company: "", position: "", startDate: "", endDate: "", current: false, bullets: [""] }],
          },
        })),
      updateExperience: (id, patch) =>
        set((s) => ({ resume: { ...s.resume, experiences: arrayCrud(s.resume.experiences).update(id, patch) } })),
      removeExperience: (id) =>
        set((s) => ({ resume: { ...s.resume, experiences: s.resume.experiences.filter((e) => e.id !== id) } })),
      reorderExperiences: (from, to) =>
        set((s) => ({ resume: { ...s.resume, experiences: arrayCrud(s.resume.experiences).reorder(from, to) } })),

      // ===== projects =====
      addProject: () =>
        set((s) => ({
          resume: { ...s.resume, projects: [...s.resume.projects, { id: uid(), name: "", role: "", link: "", bullets: [""] }] },
        })),
      updateProject: (id, patch) =>
        set((s) => ({ resume: { ...s.resume, projects: arrayCrud(s.resume.projects).update(id, patch) } })),
      removeProject: (id) =>
        set((s) => ({ resume: { ...s.resume, projects: s.resume.projects.filter((e) => e.id !== id) } })),
      reorderProjects: (from, to) =>
        set((s) => ({ resume: { ...s.resume, projects: arrayCrud(s.resume.projects).reorder(from, to) } })),

      // ===== education =====
      addEducation: () =>
        set((s) => ({
          resume: { ...s.resume, education: [...s.resume.education, { id: uid(), school: "", degree: "", major: "", startDate: "", endDate: "" }] },
        })),
      updateEducation: (id, patch) =>
        set((s) => ({ resume: { ...s.resume, education: arrayCrud(s.resume.education).update(id, patch) } })),
      removeEducation: (id) =>
        set((s) => ({ resume: { ...s.resume, education: s.resume.education.filter((e) => e.id !== id) } })),
      reorderEducation: (from, to) =>
        set((s) => ({ resume: { ...s.resume, education: arrayCrud(s.resume.education).reorder(from, to) } })),

      // ===== skills =====
      addSkill: () =>
        set((s) => ({ resume: { ...s.resume, skills: [...s.resume.skills, { id: uid(), category: "", items: [] }] } })),
      updateSkill: (id, patch) =>
        set((s) => ({ resume: { ...s.resume, skills: arrayCrud(s.resume.skills).update(id, patch) } })),
      removeSkill: (id) =>
        set((s) => ({ resume: { ...s.resume, skills: s.resume.skills.filter((e) => e.id !== id) } })),
      reorderSkills: (from, to) =>
        set((s) => ({ resume: { ...s.resume, skills: arrayCrud(s.resume.skills).reorder(from, to) } })),

      // ===== certificates =====
      addCertificate: () =>
        set((s) => ({ resume: { ...s.resume, certificates: [...s.resume.certificates, { id: uid(), name: "", issuer: "", date: "" }] } })),
      updateCertificate: (id, patch) =>
        set((s) => ({ resume: { ...s.resume, certificates: arrayCrud(s.resume.certificates).update(id, patch) } })),
      removeCertificate: (id) =>
        set((s) => ({ resume: { ...s.resume, certificates: s.resume.certificates.filter((e) => e.id !== id) } })),

      // ===== languages =====
      addLanguage: () =>
        set((s) => ({ resume: { ...s.resume, languages: [...s.resume.languages, { id: uid(), name: "", level: "" }] } })),
      updateLanguage: (id, patch) =>
        set((s) => ({ resume: { ...s.resume, languages: arrayCrud(s.resume.languages).update(id, patch) } })),
      removeLanguage: (id) =>
        set((s) => ({ resume: { ...s.resume, languages: s.resume.languages.filter((e) => e.id !== id) } })),

      // ===== awards =====
      addAward: () =>
        set((s) => ({ resume: { ...s.resume, awards: [...s.resume.awards, { id: uid(), title: "", issuer: "", date: "" }] } })),
      updateAward: (id, patch) =>
        set((s) => ({ resume: { ...s.resume, awards: arrayCrud(s.resume.awards).update(id, patch) } })),
      removeAward: (id) =>
        set((s) => ({ resume: { ...s.resume, awards: s.resume.awards.filter((e) => e.id !== id) } })),

      reset: () => set({ resume: defaultResume, sectionOrder: defaultSectionOrder, theme: defaultTheme }),
    }),
    {
      name: "telos-resume-v2",
      partialize: (state) => {
        const { _onePageSnapshot, ...rest } = state;
        return rest;
      },
    },
  ),
);

const stripTags = (s: string) => s.replace(/<[^>]*>/g, "");
export const filled = (v: string) => stripTags(v).trim().length > 0;

/** 判断某个模块是否有内容(用于预览区隐藏空模块) */
export function hasSectionContent(r: Resume, key: SectionKey): boolean {
  switch (key) {
    case "experiences":
      return r.experiences.some((e) => e.company && e.bullets.some(filled));
    case "projects":
      return r.projects.some((p) => p.name);
    case "education":
      return r.education.some((e) => e.school);
    case "skills":
      return r.skills.some((s) => s.items.some(filled));
    case "certificates":
      return r.certificates.some((c) => c.name);
    case "languages":
      return r.languages.some((l) => l.name);
    case "awards":
      return r.awards.some((a) => a.title);
    default:
      return false;
  }
}

/** 完成度 */
export function computeCompletion(r: Resume): number {
  const b = r.basics;
  const checks = [b.name, b.headline, b.email, b.phone, b.summary];
  let done = checks.filter(filled).length;
  let total = checks.length;
  const sections: SectionKey[] = ["experiences", "projects", "education", "skills", "certificates", "languages", "awards"];
  for (const k of sections) {
    if (hasSectionContent(r, k)) done += 1;
    total += 1;
  }
  return Math.round((done / total) * 100);
}
