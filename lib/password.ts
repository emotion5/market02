// 비밀번호 규칙 — 클라이언트 폼과 서버 스키마가 공유하는 단일 출처.
// 규칙: 8자 이상 + 특수문자 1자 이상.
const SPECIAL = /[!@#$%^&*()_+\-=[\]{}|;:'",.<>/?`~\\]/;

export function isValidPassword(pw: string): boolean {
  return pw.length >= 8 && SPECIAL.test(pw);
}

// 폼 안내/서버 에러 문구도 한 곳에서 관리.
export const PASSWORD_HINT = "8자 이상, 특수문자를 1자 이상 포함해주세요.";
export const PASSWORD_ERROR =
  "비밀번호는 8자 이상이며 특수문자를 1자 이상 포함해야 합니다.";
