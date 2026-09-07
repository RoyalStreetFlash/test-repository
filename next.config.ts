// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CloudFrontドメインからの画像読み込みを許可する
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.cloudfront.net", // すべてのCloudFrontドメインを許可
      },
    ],
  },
};

export default nextConfig;