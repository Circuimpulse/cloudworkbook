import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare移行を見据えた設定
  experimental: {
    // Edge Runtimeを優先的に使用
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  
  // 静的エクスポートは使わない（認証があるため）
  output: "standalone",
  
  // 画像最適化（Cloudflare移行時は別途対応が必要）
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
};

export default nextConfig;
