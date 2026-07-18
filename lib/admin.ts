import "server-only";

// 어드민 화면(서버 컴포넌트)이 쓰는 읽기 게이트웨이 (app → lib → server 경계 유지).
export {
  listPendingBusinesses,
  type PendingBusiness,
} from "@/server/auth/service";

export {
  listProductsForAdmin,
  getProductForAdmin,
  type AdminProductRow,
  type AdminProductDetail,
} from "@/server/catalog/admin";
