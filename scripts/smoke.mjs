/**
 * 冒烟测试 —— 对一个已启动的 Telos 实例(默认 http://localhost:3000)跑关键路径。
 * 本地: node scripts/smoke.mjs   （需先 npm run build && npm start）
 * CI:   见 .github/workflows/ci.yml
 *
 * 覆盖：页面可加载、自定义模板(SpecRenderer)、服务端导出确为文字版 PDF。
 * 不依赖 ANTHROPIC_API_KEY —— 只测非 AI 的核心链路。
 */
import puppeteer from "puppeteer";
import zlib from "node:zlib";

const BASE = process.env.SMOKE_BASE ?? "http://localhost:3000";
const results = [];
const ok = (name, cond) => {
  results.push({ name, cond: !!cond });
  console.log(`${cond ? "✅" : "❌"} ${name}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// dev/prod 通用：用 domcontentloaded，别用 networkidle
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
page.on("dialog", (d) => d.accept());
const kill = setTimeout(() => { console.error("!! 冒烟超时(120s)"); process.exit(1); }, 120_000);

try {
  // 1) 首页 / 模板 / 编辑器可加载
  for (const [path, sel] of [["/", "body"], ["/templates", "body"], ["/editor", "#resume-sheet"]]) {
    await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 45_000 });
    const found = await page.waitForSelector(sel, { timeout: 30_000 }).then(() => true).catch(() => false);
    ok(`页面 ${path} 加载`, found);
  }

  // 2) 自定义模板：新建 → SpecRenderer 渲染
  const click = (t) => page.evaluate((x) => {
    const b = [...document.querySelectorAll("button")].find((e) => e.offsetParent && (e.textContent ?? "").trim().startsWith(x));
    if (b) { b.click(); return true; } return false;
  }, t);
  await click("经典专业"); await sleep(400);
  await click("+ 自定义"); await sleep(400);
  await click("+ 新建模板"); await sleep(700);
  const sheetLen = await page.$eval("#resume-sheet", (e) => e.innerHTML.length).catch(() => 0);
  ok("自定义模板 SpecRenderer 渲染", sheetLen > 500);

  // 3) 服务端导出：确为文字版 PDF（有文字算子、零内嵌图片）
  const payload = {
    resume: { basics: { name: "冒烟测试", headline: "工程师", email: "a@b.c", phone: "1", location: "x", availability: "", summary: "<p>hi</p>" },
      experiences: [{ id: "e1", company: "公司", position: "岗位", startDate: "2020", endDate: "", current: true, bullets: ["<p>做了事</p>"] }],
      projects: [], education: [], skills: [], certificates: [], languages: [], awards: [] },
    theme: { template: "classic", font: "sans", accent: "oklch(0.56 0.195 255)", spacing: "normal" },
    sectionOrder: ["experiences", "projects", "education", "skills", "certificates", "languages", "awards"],
  };
  const res = await fetch(BASE + "/api/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  ok("导出接口 200 + PDF", res.ok && res.headers.get("content-type")?.includes("pdf"));
  const buf = Buffer.from(await res.arrayBuffer());
  const streams = [...buf.toString("latin1").matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)].map((m) => m[1]);
  let tj = 0;
  for (const s of streams) {
    let d = Buffer.from(s, "latin1");
    try { d = zlib.inflateSync(d); } catch { /* 未压缩 */ }
    tj += (d.toString("latin1").match(/\bTJ\b|\bTj\b/g) || []).length;
  }
  const noImg = !buf.includes(Buffer.from("/Subtype/Image")) && !buf.includes(Buffer.from("/Subtype /Image"));
  ok(`导出是文字版 PDF (${tj} 文字算子, 无内嵌图)`, tj > 20 && noImg);
} catch (e) {
  ok(`未预期错误: ${String(e).slice(0, 120)}`, false);
} finally {
  clearTimeout(kill);
  await browser.close();
}

const failed = results.filter((r) => !r.cond);
console.log(failed.length === 0 ? "\n=== 冒烟全部通过 ===" : `\n=== ${failed.length} 项失败 ===`);
process.exit(failed.length === 0 ? 0 : 1);
