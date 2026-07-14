import { generateObject } from "ai";
import { getModel, hasApiKey, cleanResumeForAI, SYSTEM_ANALYZE, SYSTEM_JD_ANALYZE } from "@/lib/ai";
import { generalAnalysisSchema, jdAnalysisSchema } from "@/lib/analysis-schema";
import { rateLimit, RL } from "@/lib/rate-limit";
import { captureError } from "@/lib/observability";

export async function POST(req: Request) {
  const limited = rateLimit(req, RL.ai);
  if (limited) return limited;

  if (!hasApiKey()) {
    return Response.json(
      { error: "未配置 ANTHROPIC_API_KEY,请在 .env.local 设置后重启服务。" },
      { status: 503 },
    );
  }

  const { resume, jd } = await req.json();
  if (!resume) {
    return Response.json({ error: "缺少 resume" }, { status: 400 });
  }

  const cleaned = cleanResumeForAI(resume);
  const isJd = Boolean(jd?.trim());

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: isJd ? jdAnalysisSchema : generalAnalysisSchema,
      system: isJd ? SYSTEM_JD_ANALYZE : SYSTEM_ANALYZE,
      prompt: isJd
        ? `简历:\n${JSON.stringify(cleaned)}\n\n目标职位 JD:\n${jd}`
        : `简历:\n${JSON.stringify(cleaned)}`,
    });
    const result = isJd ? { type: "jd" as const, ...object } : { type: "general" as const, ...object };
    return Response.json(result);
  } catch (e) {
    captureError(e, { scope: "api/analyze", isJd });
    return Response.json({ error: "AI 分析失败,请重试" }, { status: 502 });
  }
}
