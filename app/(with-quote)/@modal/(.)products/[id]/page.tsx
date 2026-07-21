import { notFound } from "next/navigation";
import { getProduct, isWholesaleViewer, getCategory } from "@/lib/data";
import ProductModal from "@/components/product/ProductModal";
import ProductDetail from "@/components/product/ProductDetail";

// 목록에서 상품을 클릭(소프트 내비게이션)하면 이 인터셉트가 상세를 모달로 띄운다.
// 새로고침/직접 접근 등 하드 내비게이션에서는 인터셉트되지 않고 실제 상세 페이지가 열린다.
export default async function ProductModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, wholesale] = await Promise.all([
    getProduct(id),
    isWholesaleViewer(),
  ]);
  if (!product) notFound();

  const category = await getCategory(product.category);

  return (
    <ProductModal>
      <ProductDetail
        product={product}
        categoryName={category?.name}
        variant="modal"
        wholesale={wholesale}
      />
    </ProductModal>
  );
}
