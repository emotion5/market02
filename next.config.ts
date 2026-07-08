import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 홈 디렉토리의 잡동사니 lockfile 때문에 루트를 잘못 추론하는 것 방지
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
