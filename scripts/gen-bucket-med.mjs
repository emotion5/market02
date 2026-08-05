// Supabase(서울) product-images 버킷에서 .med.webp / .thumb.webp 파생본이 없는
// 원본에 대해 파생본을 생성해 업로드한다. 앱 업로드 라우트와 같은 사양.
//   .thumb.webp : 96x96 cover, webp q70
//   .med.webp   : 600 inside(확대 안 함), webp q80
// 재실행 안전: 이미 있으면 건너뛴다.
//   실행:  node --env-file=.env scripts/gen-bucket-med.mjs
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

const BUCKET = "product-images";
const PUBLIC_BASE = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;

const s3 = new S3Client({
  region: process.env.SUPABASE_S3_REGION,
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

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

// 1) 버킷 전체 키 목록(페이지네이션)
const keys = new Set();
let token;
do {
  const res = await s3.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: "products/",
      ContinuationToken: token,
    }),
  );
  for (const o of res.Contents ?? []) keys.add(o.Key);
  token = res.IsTruncated ? res.NextContinuationToken : undefined;
} while (token);

const originals = [...keys].filter(
  (k) => k.endsWith(".webp") && !/\.(thumb|med)\.webp$/i.test(k),
);
console.log(`원본 ${originals.length}개, 버킷 객체 ${keys.size}개`);

let made = 0,
  skipped = 0,
  failed = 0;
for (const key of originals) {
  let srcBuf = null;
  for (const { suffix, run } of DERIVATIVES) {
    const outKey = key.replace(/\.webp$/i, suffix);
    if (keys.has(outKey)) {
      skipped++;
      continue;
    }
    try {
      if (!srcBuf) {
        const r = await fetch(`${PUBLIC_BASE}/${key}`);
        if (!r.ok) throw new Error(`원본 다운로드 실패 HTTP ${r.status}`);
        srcBuf = Buffer.from(await r.arrayBuffer());
      }
      const body = await run(sharp(srcBuf)).toBuffer();
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: outKey,
          Body: body,
          ContentType: "image/webp",
        }),
      );
      console.log(`생성: ${outKey} (${body.length}B)`);
      made++;
    } catch (e) {
      console.error(`실패: ${outKey} — ${e.message}`);
      failed++;
    }
  }
}
console.log(`\n완료 — 생성 ${made}, 건너뜀 ${skipped}, 실패 ${failed}`);
