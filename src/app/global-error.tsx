"use client";

import { useEffect } from "react";

/**
 * 全局错误边界（客户端渲染崩溃兜底）。
 * 把错误上报到 /api/client-error（服务端再走 captureError），并给用户一个体面的重试。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: error.message, stack: error.stack, digest: error.digest }),
    }).catch(() => {});
  }, [error]);

  return (
    <html lang="zh-CN">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>页面出了点问题</h2>
          <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>已记录该错误，你可以重试或刷新页面。</p>
          <button
            onClick={reset}
            style={{ background: "#3b6ef5", color: "#fff", border: 0, borderRadius: 8, padding: "8px 20px", fontSize: 14, cursor: "pointer" }}
          >
            重试
          </button>
        </div>
      </body>
    </html>
  );
}
