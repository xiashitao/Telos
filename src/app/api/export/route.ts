import type { NextRequest } from "next/server";
import puppeteer, { type Browser } from "puppeteer";
import { putExport, getExport, dropExport } from "@/lib/export-store";
import { rateLimit, RL } from "@/lib/rate-limit";
import { captureError } from "@/lib/observability";

// headless 浏览器需 Node 运行时；导出可能耗时，放宽上限。
export const runtime = "nodejs";
export const maxDuration = 60;

/** 打印页 /print 用 token 取回待渲染的简历数据。 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const data = getExport(token);
  if (!data) return Response.json({ error: "导出数据不存在或已过期" }, { status: 404 });
  return Response.json(data);
}

/** 生成 A4 文字版 PDF：暂存数据 → 无头浏览器打开 /print 渲染真实预览 → page.pdf。 */
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, RL.heavy);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  if (!body?.resume) {
    return Response.json({ error: "缺少简历数据" }, { status: 400 });
  }

  // TODO(收费): 在此插入权益判断——按 user_id + resume 查 export_count / wallet，
  // 决定放行 / 扣费 / 拦截返回 402。详见 MONETIZATION.md。

  const format = body.format === "html" ? "html" : "pdf";
  const token = putExport(body);
  // 生产在反代后面时，让无头浏览器走本机回环渲染打印页，不绕公网
  const origin = process.env.EXPORT_BASE_URL || req.nextUrl.origin;
  const name = body.resume?.basics?.name?.trim() || "我的简历";
  let browser: Browser | undefined;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(`${origin}/print?token=${token}`, {
      waitUntil: "networkidle0",
      timeout: 30_000,
    });
    // 等简历骨架出现 + Web 字体就绪，避免截到未排版好的内容。
    await page.waitForSelector("#resume-sheet", { timeout: 15_000 });
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
    });

    if (format === "html") {
      // 把同源 CSS 规则内联进 <style>、移除 Next 脚本，产出可独立打开的自包含 HTML。
      // 跨源样式表（Google Fonts）读不到 cssRules，保留其 <link> 由 CDN 加载。
      const html = await page.evaluate(() => {
        const rules: string[] = [];
        for (const sheet of Array.from(document.styleSheets)) {
          try {
            for (const rule of Array.from(sheet.cssRules)) rules.push(rule.cssText);
          } catch {
            /* 跨源样式表，跳过；其 <link> 仍留在 <head> */
          }
        }
        // 去掉 Next 的脚本与预加载/同源样式表链接（样式已内联），只留字体 CDN 链接。
        document
          .querySelectorAll('script, link[rel="modulepreload"], link[rel="preload"]')
          .forEach((e) => e.remove());
        document.querySelectorAll('link[rel="stylesheet"]').forEach((l) => {
          if ((l as HTMLLinkElement).href.includes("/_next/")) l.remove();
        });
        document.head.insertAdjacentHTML("beforeend", `<style>${rules.join("\n")}</style>`);
        return "<!doctype html>\n" + document.documentElement.outerHTML;
      });
      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name + "-Telos简历.html")}`,
        },
      });
    }

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name + "-Telos简历.pdf")}`,
      },
    });
  } catch (e) {
    captureError(e, { scope: "api/export", format });
    return Response.json({ error: "生成 PDF 失败,请重试" }, { status: 500 });
  } finally {
    if (browser) await browser.close();
    dropExport(token);
  }
}
