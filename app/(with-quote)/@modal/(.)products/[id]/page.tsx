import { notFound } from "next/navigation";
import { isWholesaleViewer } from "@/lib/data";
import { getProduct, getCategories } from "@/server/catalog/service";
import { getSiteSettings } from "@/lib/settings";
import ProductDetail from "@/components/product/ProductDetail";

// 목록에서 상품을 클릭(소프트 내비게이션)하면 이 인터셉트가 상세를 모달로 띄운다.
// 새로고침/직접 접근 등 하드 내비게이션에서는 인터셉트되지 않고 실제 상세 페이지가 열린다.
//
// wholesale 자격은 한 번만 조회하고, 상품·카테고리·사이트설정은 병렬로 가져온다
// (원격 DB 왕복이 직렬로 쌓이지 않도록). settings 는 ProductDetail 에 넘겨 중복 조회를 없앤다.
export default async function ProductModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const wholesale = await isWholesaleViewer();
  const [product, categories, settings] = await Promise.all([
    getProduct(id, { wholesale }),
    getCategories(),
    getSiteSettings(),
  ]);
  if (!product) notFound();
  const category = categories.find((c) => c.slug === product.category);

  // 모달 껍데기(ProductModal)는 이 세그먼트의 layout 이 감싼다.
  return (
    <ProductDetail
      product={product}
      categoryName={category?.name}
      variant="modal"
      wholesale={wholesale}
      settings={settings}
    />
  );
}
