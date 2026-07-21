// public/images/products/** 의 상품 이미지마다 경량 썸네일(.thumb.webp)을 생성한다.
// 견적서·상품 목록에서 원본(최대 100KB) 대신 이 파일(~2-4KB)을 불러 전송량을 줄인다.
// 재실행 안전: 이미 있으면 건너뛴다(--force 로 전체 재생성).
//   실행:  npm run thumbs        # 없는 것만 생성
//          npm run thumbs -- --force
import { readdirSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import sharp from "sharp";

const ROOT = "public/images/products";
const SIZE = 96; // 화면 표시 34px의 약 2배(레티나 대응) — webp 기준 수 KB 수준
const force = process.argv.includes("--force");
const SRC_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const files = walk(ROOT).filter(
  (p) => SRC_EXT.has(extname(p).toLowerCase()) && !p.endsWith(".thumb.webp"),
);

let made = 0;
let skipped = 0;
let failed = 0;
for (const src of files) {
  const out = src.replace(/\.[^.]+$/, ".thumb.webp");
  if (!force && existsSync(out)) {
    skipped++;
    continue;
  }
  try {
    await sharp(src)
      .resize(SIZE, SIZE, { fit: "cover" })
      .webp({ quality: 70 })
      .toFile(out);
    made++;
  } catch (e) {
    console.error("thumb 실패:", src, e.message);
    failed++;
  }
}

console.log(`썸네일 생성 완료 — 생성 ${made}, 건너뜀 ${skipped}, 실패 ${failed}`);
