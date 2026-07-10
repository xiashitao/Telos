import { z } from "zod";
import type { Resume } from "./schema";

/**
 * 简历导入 schema —— 供 AI 流式结构化用（streamObject + useObject 共用）。
 * 与 resumeSchema 基本一致，但**不含数组项的 id**（id 由前端生成，AI 产的不可靠），
 * 且字段带 describe 提示模型该往里填什么。
 */
export const importResumeSchema = z.object({
  basics: z.object({
    name: z.string().describe("姓名"),
    headline: z.string().describe("一句话定位/求职方向，如『高级前端工程师 · 7年经验』"),
    email: z.string().describe("邮箱"),
    phone: z.string().describe("电话"),
    location: z.string().describe("所在城市"),
    availability: z.string().describe("到岗时间，如『随时可面试』；没有就留空"),
    summary: z.string().describe("个人简介，一段话，可含 HTML 加粗标签"),
  }),
  experiences: z.array(
    z.object({
      company: z.string().describe("公司名"),
      position: z.string().describe("职位"),
      startDate: z.string().describe("开始时间，如 2021.03"),
      endDate: z.string().describe("结束时间；在职则留空"),
      current: z.boolean().describe("是否在职"),
      bullets: z.array(z.string()).describe("工作亮点，每条一段，动词开头、尽量量化，可含 <strong>"),
    }),
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      role: z.string().describe("担任角色"),
      link: z.string().describe("链接，没有留空"),
      bullets: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string().describe("学位，如 学士/硕士"),
      major: z.string().describe("专业"),
      startDate: z.string(),
      endDate: z.string(),
    }),
  ),
  skills: z.array(
    z.object({
      category: z.string().describe("技能分组名，如『前端框架』"),
      items: z.array(z.string()).describe("该组下的技能词"),
    }),
  ),
  certificates: z.array(
    z.object({ name: z.string(), issuer: z.string().describe("颁发机构"), date: z.string() }),
  ),
  languages: z.array(z.object({ name: z.string(), level: z.string().describe("水平，如 CET-6") })),
  awards: z.array(z.object({ title: z.string(), issuer: z.string(), date: z.string() })),
});

export type ImportResume = z.infer<typeof importResumeSchema>;

/** 流式 partial 深度可选 */
type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
type PartialImport = DeepPartial<ImportResume>;

const str = (v: unknown) => (typeof v === "string" ? v : "");
const strArr = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

/**
 * 把流式的 partial 对象安全地转成完整 Resume（补默认值 + 生成稳定 id）。
 * 流式期间用基于下标的稳定 id（imp-<sec>-<i>），避免 React key 抖动。
 */
export function buildResumeFromPartial(p: PartialImport | undefined): Resume {
  const b = p?.basics ?? {};
  return {
    basics: {
      name: str(b.name),
      headline: str(b.headline),
      email: str(b.email),
      phone: str(b.phone),
      location: str(b.location),
      availability: str(b.availability),
      summary: str(b.summary),
      photo: "", // 导入的文本简历不含照片；photo 由用户后续上传
    },
    experiences: (p?.experiences ?? []).map((e, i) => ({
      id: `imp-exp-${i}`,
      company: str(e?.company),
      position: str(e?.position),
      startDate: str(e?.startDate),
      endDate: str(e?.endDate),
      current: Boolean(e?.current),
      bullets: strArr(e?.bullets),
    })),
    projects: (p?.projects ?? []).map((e, i) => ({
      id: `imp-proj-${i}`,
      name: str(e?.name),
      role: str(e?.role),
      link: str(e?.link),
      bullets: strArr(e?.bullets),
    })),
    education: (p?.education ?? []).map((e, i) => ({
      id: `imp-edu-${i}`,
      school: str(e?.school),
      degree: str(e?.degree),
      major: str(e?.major),
      startDate: str(e?.startDate),
      endDate: str(e?.endDate),
    })),
    skills: (p?.skills ?? []).map((e, i) => ({
      id: `imp-skill-${i}`,
      category: str(e?.category),
      items: strArr(e?.items),
    })),
    certificates: (p?.certificates ?? []).map((e, i) => ({
      id: `imp-cert-${i}`,
      name: str(e?.name),
      issuer: str(e?.issuer),
      date: str(e?.date),
    })),
    languages: (p?.languages ?? []).map((e, i) => ({
      id: `imp-lang-${i}`,
      name: str(e?.name),
      level: str(e?.level),
    })),
    awards: (p?.awards ?? []).map((e, i) => ({
      id: `imp-award-${i}`,
      title: str(e?.title),
      issuer: str(e?.issuer),
      date: str(e?.date),
    })),
  };
}
