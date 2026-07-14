import { streamObject } from "ai";
import { getModel, hasApiKey } from "@/lib/ai";
import { importResumeSchema } from "@/lib/import-schema";
import { rateLimit, RL } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_IMPORT = `你是简历结构化助手。用户会粘贴一份简历文本(可能是 Markdown、纯文本或从 PDF 提取的文本)。
请把它忠实地拆解到给定的结构化字段里。

## 规则
- 忠实提取原文信息,**绝不杜撰**——原文没有的字段留空字符串或空数组
- 经历/项目的描述拆成独立的 bullet,每条一个核心成果,动词开头
- 保留原文中的量化数据(数字/百分比/规模)
- 可用 <strong> 标签加粗关键成果,其余不加多余 HTML
- 日期统一为"YYYY.MM"格式(如"2021.03"),仅有年份则写"2021"
- 在职的经历 current 设为 true,endDate 留空
- 中文简历保持中文,英文简历保持英文
- 如果原文包含个人简介/自我评价,放入 basics.summary;没有则留空`;

/** 把粘贴的 Markdown/文本流式结构化成简历对象（供前端边收边填表单）。 */
export async function POST(req: Request) {
  const limited = rateLimit(req, RL.ai);
  if (limited) return limited;

  if (!hasApiKey()) {
    return Response.json(
      { error: "未配置 ANTHROPIC_API_KEY,请在 .env.local 设置后重启服务。" },
      { status: 503 },
    );
  }
  const { text } = (await req.json()) as { text?: string };
  if (!text?.trim()) {
    return Response.json({ error: "缺少简历文本" }, { status: 400 });
  }

  const result = streamObject({
    model: getModel(),
    schema: importResumeSchema,
    system: SYSTEM_IMPORT,
    prompt: `请结构化下面这份简历：\n\n${text}`,
  });

  return result.toTextStreamResponse();
}
