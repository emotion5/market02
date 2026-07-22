import sharp from "sharp";
import { getAdmin } from "@/lib/admin-guard";
import { uploadPublic, deletePublic } from "@/server/storage";
import {
  setRepImage,
  addGalleryImage,
  removeGalleryImage,
} from "@/server/catalog/admin";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdmin();
  if (!admin) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const { id } = await params;
  const form = await request.formData();
  const file = form.get("file");
  const kind = form.get("kind");
  if (!(file instanceof File)) {
    return Response.json({ error: "파일이 필요합니다." }, { status: 400 });
  }
  const ext = EXT[file.type];
  if (!ext) {
    return Response.json(
      { error: "이미지 파일(jpg/png/webp/avif/gif)만 업로드할 수 있습니다." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "5MB 이하만 가능합니다." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // 대표 이미지(master): EXIF 회전 보정 후 긴 변 1600px로 자동 축소 + WebP 변환.
  // 원본을 그대로 두지 않고 상한을 걸어 저장·전송량을 통제한다.
  // (withoutEnlargement: 원본이 1600px 미만이면 억지로 늘려 흐려지지 않게 유지)
  const key = `products/${id}/${crypto.randomUUID()}.webp`;
  let master: Buffer;
  try {
    master = await sharp(buffer, { animated: true })
      .rotate()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return Response.json(
      { error: "이미지를 처리할 수 없습니다." },
      { status: 400 },
    );
  }
  const url = await uploadPublic(key, master, "image/webp");

  // 경량 썸네일(.thumb.webp) 동반 업로드 — 견적서·장바구니 초소형 이미지에서
  // 원본 대신 이 파일을 불러 전송량을 줄인다. 실패해도 원본으로 폴백되므로 치명적이지 않다.
  try {
    const thumb = await sharp(buffer)
      .rotate()
      .resize(96, 96, { fit: "cover" })
      .webp({ quality: 70 })
      .toBuffer();
    await uploadPublic(
      key.replace(/\.[^.]+$/, ".thumb.webp"),
      thumb,
      "image/webp",
    );
  } catch {
    // 썸네일 생성 실패 무시
  }

  // 중간 썸네일(.med.webp) 동반 업로드 — 상품 카드·목록·상세 썸네일에서 원본(1600px)
  // 대신 이 600px 파일을 불러 전송량을 줄인다. master 와 같은 프레이밍(fit: inside)을
  // 유지하고, 실패해도 원본으로 폴백된다.
  try {
    const medium = await sharp(buffer, { animated: true })
      .rotate()
      .resize(600, 600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    await uploadPublic(
      key.replace(/\.[^.]+$/, ".med.webp"),
      medium,
      "image/webp",
    );
  } catch {
    // 중간 썸네일 생성 실패 무시
  }

  if (kind === "rep") {
    await setRepImage(id, url);
    return Response.json({ repImage: url });
  }
  const image = await addGalleryImage(id, url);
  return Response.json({ image });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdmin();
  if (!admin) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const { id } = await params;
  const imageId = new URL(request.url).searchParams.get("imageId");
  if (!imageId) {
    return Response.json({ error: "imageId 가 필요합니다." }, { status: 400 });
  }
  const url = await removeGalleryImage(id, imageId);
  if (url === null) {
    return Response.json({ error: "이미지를 찾을 수 없습니다." }, { status: 404 });
  }
  // Supabase 에 올린 파일이면 스토리지에서도 제거(고아 파일 방지)
  const marker = "/product-images/";
  const idx = url.indexOf(marker);
  if (idx >= 0) {
    const storageKey = url.slice(idx + marker.length);
    try {
      await deletePublic(storageKey);
    } catch {
      // 스토리지 삭제 실패는 무시(DB는 이미 삭제됨)
    }
    // 동반 생성했던 썸네일(.thumb.webp / .med.webp)도 함께 제거(고아 파일 방지)
    try {
      await deletePublic(storageKey.replace(/\.[^.]+$/, ".thumb.webp"));
    } catch {
      // 썸네일이 없거나 삭제 실패해도 무시
    }
    try {
      await deletePublic(storageKey.replace(/\.[^.]+$/, ".med.webp"));
    } catch {
      // 중간 썸네일이 없거나 삭제 실패해도 무시
    }
  }
  return Response.json({ ok: true });
}
