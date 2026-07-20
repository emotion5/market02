import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
// 카테고리 원본은 lib/constants.ts 한 곳(단일 출처). node 로 직접 실행되므로
// @/ 별칭 대신 상대경로 + .ts 확장자로 가져온다(allowImportingTsExtensions).
import { CATEGORIES } from "../lib/constants.ts";

// mock-products.json · featured.json · 카테고리를 DB로 주입한다(멱등).

interface SeedVariant {
  id: string;
  name: string;
  price: number;
}
interface SeedProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  summary?: string;
  description: string;
  image: string;
  variants: SeedVariant[];
  colors?: string[];
}

const root = process.cwd();

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(path.join(root, rel), "utf8")) as T;
}

// 상세 갤러리 이미지를 파일명 규칙으로 수집 (lib/data.ts resolveImages 와 동일 규칙).
// 대표: {id}.ext, 추가: {id}-1.ext … 반환 순서 대표 → 1 → 2 …
function galleryImages(product: SeedProduct): string[] {
  const webPath = product.image;
  const slash = webPath.lastIndexOf("/");
  if (slash < 0) return [product.image];
  const dirWeb = webPath.slice(0, slash);
  const dirFs = path.join(root, "public", dirWeb);

  let files: string[];
  try {
    files = readdirSync(dirFs);
  } catch {
    return [product.image];
  }

  const esc = product.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^${esc}(?:-(\\d+))?\\.(?:jpe?g|png|webp|avif)$`, "i");
  const matched = files
    .map((file) => {
      const m = re.exec(file);
      return m ? { file, order: m[1] ? parseInt(m[1], 10) : 0 } : null;
    })
    .filter((x): x is { file: string; order: number } => x !== null)
    .sort((a, b) => a.order - b.order)
    .map((x) => `${dirWeb}/${x.file}`);

  return matched.length > 0 ? matched : [product.image];
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = readJson<SeedProduct[]>("data/mock-products.json");
  const featured = readJson<Record<string, string[]>>("data/featured.json");
  const productIds = new Set(products.map((p) => p.id));

  // 1) 카테고리 (배열 순서 = sortOrder). name/en → nameKo/nameEn 로 매핑.
  //    showInNav/showOnHome 은 관리자 편집값이라 update 에서 건드리지 않는다(재시드해도 보존).
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { nameKo: c.name, nameEn: c.en, sortOrder: i },
      create: { slug: c.slug, nameKo: c.name, nameEn: c.en, sortOrder: i },
    });
  }

  // 2) 상품 + 옵션/색상/이미지 (자식은 삭제 후 재생성 → 멱등)
  const perCat: Record<string, number> = {};
  for (const p of products) {
    const sortOrder = perCat[p.category] ?? 0;
    perCat[p.category] = sortOrder + 1;

    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        categorySlug: p.category,
        summary: p.summary ?? null,
        description: p.description,
        repImage: p.image,
        price: p.price,
        sortOrder,
        isActive: true,
      },
      create: {
        id: p.id,
        name: p.name,
        categorySlug: p.category,
        summary: p.summary ?? null,
        description: p.description,
        repImage: p.image,
        price: p.price,
        sortOrder,
      },
    });

    await prisma.variant.deleteMany({ where: { productId: p.id } });
    await prisma.variant.createMany({
      data: p.variants.map((v, idx) => ({
        id: v.id,
        productId: p.id,
        name: v.name,
        price: v.price,
        // 회원도매가 placeholder(소비자가 90%). 실제 값은 추후 어드민/사업자가 설정.
        wholesalePrice: Math.round((v.price * 0.9) / 10) * 10,
        sortOrder: idx,
      })),
    });

    await prisma.productColor.deleteMany({ where: { productId: p.id } });
    if (p.colors?.length) {
      await prisma.productColor.createMany({
        data: p.colors.map((hex, idx) => ({
          productId: p.id,
          hex,
          sortOrder: idx,
        })),
      });
    }

    await prisma.productImage.deleteMany({ where: { productId: p.id } });
    await prisma.productImage.createMany({
      data: galleryImages(p).map((url, idx) => ({
        productId: p.id,
        url,
        sortOrder: idx,
      })),
    });
  }

  // 3) 홈 큐레이션 (존재하는 상품만)
  await prisma.featured.deleteMany({});
  for (const cat of CATEGORIES) {
    const ids = (featured[cat.slug] ?? []).filter((id) => productIds.has(id));
    await prisma.featured.createMany({
      data: ids.map((productId, i) => ({
        categorySlug: cat.slug,
        productId,
        sortOrder: i,
      })),
    });
  }

  const counts = {
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    variants: await prisma.variant.count(),
    featured: await prisma.featured.count(),
  };
  console.log("seed done:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
