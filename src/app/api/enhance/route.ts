import { streamText } from "ai";
import { getModel, hasApiKey, SYSTEM_ENHANCE } from "@/lib/ai";
import { rateLimit, RL } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const limited = rateLimit(req, RL.ai);
  if (limited) return limited;

  if (!hasApiKey()) {
    return Response.json(
      { error: "未配置 ANTHROPIC_API_KEY,请在 .env.local 设置后重启服务。" },
      { status: 503 },
    );
  }

  const { bullet, jd, position } = (await req.json()) as {
    bullet?: string;
    jd?: string;
    position?: string;
  };
  if (!bullet?.trim()) {
    return Response.json({ error: "缺少 bullet" }, { status: 400 });
  }

  const parts: string[] = [];
  if (position) parts.push(`候选人职位: ${position}`);
  if (jd) parts.push(`目标 JD:\n${jd}`);
  parts.push(`请重写以下经历要点:\n${bullet}`);

  const result = streamText({
    model: getModel(),
    system: SYSTEM_ENHANCE,
    prompt: parts.join("\n\n"),
  });

  return result.toTextStreamResponse();
}
