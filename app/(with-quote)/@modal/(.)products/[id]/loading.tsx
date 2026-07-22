import ProductModal from "@/components/product/ProductModal";
import ProductDetailSkeleton from "@/components/product/ProductDetailSkeleton";

// 인터셉트 상세 모달이 서버에서 렌더되는 동안 표시되는 Suspense 폴백.
// 클릭 즉시 모달 틀과 스켈레톤이 떠서 체감 지연을 없앤다.
export default function Loading() {
  return (
    <ProductModal>
      <ProductDetailSkeleton />
    </ProductModal>
  );
}
