import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 홈 디렉토리의 잡동사니 lockfile 때문에 루트를 잘못 추론하는 것 방지
  turbopack: {
    root: __dirname,
  },
  // 개발 화면 좌측 하단 인디케이터(N 로고) 숨김
  devIndicators: false,
};

export default nextConfig;
