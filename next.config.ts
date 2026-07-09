import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 钉死 Turbopack 根目录为本项目,避免被上级目录的其他 lockfile 干扰
  turbopack: { root: __dirname },
  // 允许局域网 IP 访问时 HMR WebSocket 正常连接
  allowedDevOrigins: ["30.166.229.56"],
  // pdf-parse / puppeteer 依赖原生/大体积模块,交给 Node 直接 require,不进打包
  serverExternalPackages: ["pdf-parse", "puppeteer"],
};

export default nextConfig;
