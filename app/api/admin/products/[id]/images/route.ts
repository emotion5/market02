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
  const key = `products/${id}/${crypto.randomUUID()}.${ext}`;
  const url = await uploadPublic(key, buffer, file.type);

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
    try {
      await deletePublic(url.slice(idx + marker.length));
    } catch {
      // 스토리지 삭제 실패는 무시(DB는 이미 삭제됨)
    }
  }
  return Response.json({ ok: true });
}
