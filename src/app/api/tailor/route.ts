import { streamObject } from "ai";
import { getModel, hasApiKey, SYSTEM_TAILOR } from "@/lib/ai";
import { importResumeSchema } from "@/lib/import-schema";

export const runtime = "nodejs";
export const maxDuration = 60;

/** 按目标 JD 流式改写整份简历（供前端边收边覆盖预览）。 */
export async function POST(req: Request) {
  if (!hasApiKey()) {
    return Response.json(
      { error: "未配置 ANTHROPIC_API_KEY,请在 .env.local 设置后重启服务。" },
      { status: 503 },
    );
  }
  const { resume, jd } = (await req.json()) as { resume?: unknown; jd?: string };
  if (!resume) return Response.json({ error: "缺少简历" }, { status: 400 });
  if (!jd?.trim()) return Response.json({ error: "缺少 JD" }, { status: 400 });

  const result = streamObject({
    model: getModel(),
    schema: importResumeSchema,
    system: SYSTEM_TAILOR,
    prompt: `目标职位 JD:\n${jd}\n\n当前简历(JSON):\n${JSON.stringify(resume)}`,
  });

  return result.toTextStreamResponse();
}
