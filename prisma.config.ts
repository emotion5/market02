import path from "node:path";
import { defineConfig, env } from "prisma/config";

// Prisma CLI/config 는 .env 를 자동 로드하지 않으므로 직접 로드한다(Node 내장).
// .env 가 없어도(예: CI에서 환경변수 주입) 조용히 넘어간다.
try {
  process.loadEnvFile();
} catch {
  // .env 없음 — process.env 에 이미 주입된 값을 사용
}

// Prisma 7: 접속 URL은 스키마가 아니라 여기서 관리한다.
// datasource.url = 마이그레이션/introspection 이 쓰는 "직결" URL (서버리스 풀러 우회).
// 앱 런타임 접속은 server/db.ts 의 드라이버 어댑터(@prisma/adapter-pg)가 담당.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: env("DIRECT_URL"),
  },
});
