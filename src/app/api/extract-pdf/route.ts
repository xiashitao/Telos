import type { NextRequest } from "next/server";
import { PDFParse } from "pdf-parse";

export const runtime = "nodejs";
export const maxDuration = 30;

/** 从上传的 PDF 抽取纯文本，供前端喂给流式导入。 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "缺少 PDF 文件" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "文件过大（上限 10MB）" }, { status: 413 });
  }

  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    const parser = new PDFParse({ data: buf });
    const result = await parser.getText();
    const text = (result.text ?? "").trim();
    if (!text) {
      return Response.json(
        { error: "未能从 PDF 提取到文字（可能是扫描件/图片型 PDF）" },
        { status: 422 },
      );
    }
    return Response.json({ text });
  } catch (e) {
    console.error("[extract-pdf] 解析失败", e);
    return Response.json({ error: "PDF 解析失败,请换一个文件重试" }, { status: 500 });
  }
}
