import { streamObject } from "ai";
import { getModel, hasApiKey } from "@/lib/ai";
import { templateSpecSchema } from "@/lib/template-spec";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_VIBE = `你是简历模板设计师。用户会上传一张简历(或简历模板)的截图,
请观察它的版式设计,把设计还原成给定的结构化模板参数(TemplateSpec):
- skeleton: 整体骨架。左右分栏且窄栏在左选 sidebar-left,在右选 sidebar-right;
  顶部有整条色块横幅选 banner;否则 single。
- sidebarRatio: 分栏时窄栏的宽度百分比(24-42),目测估算。
- header: 姓名区左对齐还是居中;有无下划线分隔(underline)或色块底(band);
  姓名字号相对正文的大小档位(md/lg/xl);有无照片及形状。
- section: 模块标题的装饰样式(纯彩色小字 caps / 下划线 underline / 左侧色条 leftbar / 浅色带底 band);
  标题是中文还是英文;整体密度(紧凑/标准/宽松)。
- typography.font: 衬线体选 serif,等宽选 mono,否则 sans。
- colors: accent 取截图的主强调色(输出 #hex);headerBg 仅当 header 是色块底时给;
  sidebarBg 仅当侧栏有深色底时给,浅灰/白底留空串。
注意:你是在"神似"地还原版式风格,不是像素级复刻;拿不准的字段用保守常规值。`;

/** 截图 → 流式产出 TemplateSpec（vibe coding）。 */
export async function POST(req: Request) {
  if (!hasApiKey()) {
    return Response.json(
      { error: "未配置 ANTHROPIC_API_KEY,请在 .env.local 设置后重启服务。" },
      { status: 503 },
    );
  }
  const { image } = (await req.json()) as { image?: string };
  if (!image?.startsWith("data:image/")) {
    return Response.json({ error: "缺少截图（需 data:image/* base64）" }, { status: 400 });
  }
  if (image.length > 7_000_000) {
    return Response.json({ error: "图片过大（上限约 5MB）" }, { status: 413 });
  }

  const result = streamObject({
    model: getModel(),
    schema: templateSpecSchema,
    system: SYSTEM_VIBE,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", image },
          { type: "text", text: "请把这张简历截图的版式还原成 TemplateSpec。" },
        ],
      },
    ],
  });

  return result.toTextStreamResponse();
}
