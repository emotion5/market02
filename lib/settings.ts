import "server-only";

// 소비자 화면(서버 컴포넌트/레이아웃)이 쓰는 사이트 설정 읽기 게이트웨이.
// (app → lib → server 경계 유지)
export { getSiteSettings } from "@/server/settings/service";
