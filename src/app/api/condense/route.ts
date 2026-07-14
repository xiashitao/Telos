import { generateObject } from "ai";
import { getModel, hasApiKey, cleanResumeForAI, SYSTEM_CONDENSE } from "@/lib/ai";
import { importResumeSchema } from "@/lib/import-schema";
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

  const { resume } = await req.json();
  if (!resume) {
    return Response.json({ error: "缺少 resume" }, { status: 400 });
  }

  const cleaned = cleanResumeForAI(resume);

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: importResumeSchema,
      system: SYSTEM_CONDENSE,
      prompt: `请精简以下简历:\n${JSON.stringify(cleaned)}`,
    });
    return Response.json({ resume: object });
  } catch (e) {
    captureError(e, { scope: "api/condense" });
    return Response.json({ error: "AI 精简失败,请重试" }, { status: 502 });
  }
}
