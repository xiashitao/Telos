"use client";

/**
 * 从上传的文件抽取纯文本，喂给流式导入。
 * - PDF：走服务端 /api/extract-pdf（pdf-parse）。
 * - Markdown / txt / 其他文本：浏览器直接读。
 */
export async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");

  if (isPdf) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/extract-pdf", { method: "POST", body: form });
    if (!res.ok) {
      let msg = "PDF 解析失败";
      try {
        msg = (await res.json()).error ?? msg;
      } catch {
        /* 忽略 */
      }
      throw new Error(msg);
    }
    return ((await res.json()).text as string) ?? "";
  }

  return await file.text();
}
