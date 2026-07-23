import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, BUCKET_PUBLIC, BUCKET_PRIVATE } from "./client";

// 파일 저장소 추상화. 화면/서비스는 이 함수들만 쓴다(밑이 Supabase/R2/S3 든 무관).

const PUBLIC_BASE = `${process.env.SUPABASE_URL}/storage/v1/object/public`;

// 공개 파일의 영구 URL (공개 버킷)
export function publicUrl(key: string): string {
  return `${PUBLIC_BASE}/${BUCKET_PUBLIC}/${key}`;
}

// 공개 파일 업로드 → 공개 URL 반환
export async function uploadPublic(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_PUBLIC,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return publicUrl(key);
}

export async function deletePublic(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_PUBLIC, Key: key }));
}

// 공개 URL(상품 이미지)로부터 스토리지 파일을 best-effort 삭제.
// 원본 + 동반 생성한 .thumb.webp / .med.webp 까지 정리한다(고아 파일 방지).
// placeholder 등 우리 버킷 밖 URL 은 건너뛰고, 실패는 무시(DB 는 이미 정리된 상태).
export async function deletePublicByUrl(url: string): Promise<void> {
  const marker = "/product-images/";
  const idx = url.indexOf(marker);
  if (idx < 0) return;
  const key = url.slice(idx + marker.length);
  const keys = [
    key,
    key.replace(/\.[^.]+$/, ".thumb.webp"),
    key.replace(/\.[^.]+$/, ".med.webp"),
  ];
  for (const k of keys) {
    try {
      await deletePublic(k);
    } catch {
      // 없거나 삭제 실패해도 무시
    }
  }
}

// 비공개 파일 업로드 (사업자등록증 등)
export async function uploadPrivate(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_PRIVATE,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

// 비공개 파일의 만료되는 서명 URL (기본 5분) — 어드민 열람용
export function signedPrivateUrl(key: string, expiresIn = 300): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET_PRIVATE, Key: key }),
    { expiresIn },
  );
}

export async function deletePrivate(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_PRIVATE, Key: key }));
}
