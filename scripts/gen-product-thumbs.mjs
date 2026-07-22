// public/images/products/** 의 상품 이미지마다 파생본을 생성한다.
//  - .thumb.webp (96px)  : 견적서·장바구니 초소형 이미지용 (~2-4KB)
//  - .med.webp   (600px) : 상품 카드·목록·상세 썸네일용 — 원본(1600px) 대신 로드
// 업로드 라우트(app/api/admin/products/[id]/images/route.ts)와 같은 파생본을
// 로컬 정적 이미지에도 채워 표시 코드가 동일하게 동작하도록 한다.
// 재실행 안전: 이미 있으면 건너뛴다(--force 로 전체 재생성).
//   실행:  npm run thumbs        # 없는 것만 생성
//          npm run thumbs -- --force
import { readdirSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import sharp from "sharp";

const ROOT = "public/images/products";
const force = process.argv.includes("--force");
const SRC_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);

// 생성할 파생본 정의 — 라우트의 sharp 설정과 크기·품질을 맞춘다.
const DERIVATIVES = [
  {
    suffix: ".thumb.webp",
    run: (s) => s.resize(96, 96, { fit: "cover" }).webp({ quality: 70 }),
  },
  {
    suffix: ".med.webp",
    run: (s) =>
      s
        .resize(600, 600, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 }),
  },
];

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
  (p) =>
    SRC_EXT.has(extname(p).toLowerCase()) &&
    !/\.(thumb|med)\.webp$/i.test(p),
);

let made = 0;
let skipped = 0;
let failed = 0;
for (const src of files) {
  for (const { suffix, run } of DERIVATIVES) {
    const out = src.replace(/\.[^.]+$/, suffix);
    if (!force && existsSync(out)) {
      skipped++;
      continue;
    }
    try {
      await run(sharp(src)).toFile(out);
      made++;
    } catch (e) {
      console.error(`${suffix} 실패:`, src, e.message);
      failed++;
    }
  }
}

console.log(`파생 이미지 생성 완료 — 생성 ${made}, 건너뜀 ${skipped}, 실패 ${failed}`);
