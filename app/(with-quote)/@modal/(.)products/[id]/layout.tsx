import ProductModal from "@/components/product/ProductModal";

// 모달 껍데기(오버레이+다이얼로그)를 세그먼트 layout 에 두어, 로딩 폴백(loading.tsx)과
// 실제 콘텐츠(page.tsx)가 교체될 때 ProductModal 이 remount 되지 않게 한다.
// → 진입 애니메이션이 한 번만 재생되고, 낙관적 미리보기 → 실제 상세로 내용만 매끄럽게 바뀐다.
export default function ProductModalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProductModal>{children}</ProductModal>;
}
