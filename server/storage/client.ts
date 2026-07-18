import { S3Client } from "@aws-sdk/client-s3";

// Supabase Storage 를 S3 호환 프로토콜로 접근한다.
// (표준 S3 SDK 사용 → 나중에 R2/S3 로 이전 시 엔드포인트·키만 교체)
export const BUCKET_PUBLIC = "product-images"; // 공개: 상품 이미지
export const BUCKET_PRIVATE = "business-docs"; // 비공개: 사업자등록증 등

export const s3 = new S3Client({
  region: process.env.SUPABASE_S3_REGION,
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY ?? "",
  },
  forcePathStyle: true, // Supabase S3 는 path-style 필요
});
