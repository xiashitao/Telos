import { z } from "zod";

/**
 * TemplateSpec —— 自定义模板的「数据表示」（方案见 TEMPLATES-PLAN.md）。
 * 模板永远是这份受约束的 JSON，由 SpecRenderer 白名单式消费；
 * 绝不流转代码，AI 生成(P2)与分享(P3)传的都是它。
 *
 * v1 原则：只放渲染器真正兑现的字段，不留死参数；扩展时 bump specVersion。
 */

/** 颜色只接受 oklch(...) 或 #hex，防任意 CSS 注入 */
const colorSchema = z
  .string()
  .regex(/^(oklch\([\d.\s%/-]+\)|#[0-9a-fA-F]{3,8})$/, "仅支持 oklch() 或 #hex 颜色");

export const templateSpecSchema = z.object({
  specVersion: z.literal(1),
  /** 骨架：单栏 / 左侧栏 / 右侧栏 / 顶部色带 */
  skeleton: z.enum(["single", "sidebar-left", "sidebar-right", "banner"]),
  /** 侧栏占宽 %（仅 sidebar-* 生效） */
  sidebarRatio: z.number().min(24).max(42),
  header: z.object({
    align: z.enum(["left", "center"]),
    /** plain 无装饰 / underline 下边框线 / band 色带底(用 colors.headerBg) */
    style: z.enum(["plain", "underline", "band"]),
    /** 姓名字号档位 */
    nameScale: z.enum(["md", "lg", "xl"]),
    photo: z.enum(["none", "circle", "square"]),
  }),
  section: z.object({
    /** 模块标题样式：彩色小标题 / 下划线 / 左色条 / 浅色带底 */
    titleStyle: z.enum(["caps", "underline", "leftbar", "band"]),
    /** 标题语言：中文(经 历) / 英文(EXPERIENCE) */
    titleLang: z.enum(["zh", "en"]),
    density: z.enum(["compact", "normal", "loose"]),
  }),
  typography: z.object({
    font: z.enum(["sans", "serif", "mono"]),
  }),
  colors: z.object({
    accent: colorSchema,
    /** band header / banner 的底色；空串 = 用 accent */
    headerBg: z.union([colorSchema, z.literal("")]),
    /** 侧栏底色；空串 = 浅灰纸面 */
    sidebarBg: z.union([colorSchema, z.literal("")]),
  }),
});

export type TemplateSpec = z.infer<typeof templateSpecSchema>;

export interface CustomTemplate {
  id: string;
  name: string;
  spec: TemplateSpec;
}

/** theme.template 里自定义模板的 id 前缀 */
export const CUSTOM_PREFIX = "custom:";

export function createDefaultSpec(): TemplateSpec {
  return {
    specVersion: 1,
    skeleton: "single",
    sidebarRatio: 32,
    header: { align: "left", style: "underline", nameScale: "lg", photo: "none" },
    section: { titleStyle: "caps", titleLang: "zh", density: "normal" },
    typography: { font: "sans" },
    colors: { accent: "oklch(0.56 0.195 255)", headerBg: "", sidebarBg: "" },
  };
}

/** 解析(带校验)一份来路不明的 spec —— 分享/AI 生成的入口统一走这里 */
export function parseSpec(raw: unknown): TemplateSpec | null {
  const res = templateSpecSchema.safeParse(raw);
  return res.success ? res.data : null;
}
