import { hash, verify } from "@node-rs/argon2";

// 비밀번호 원본은 저장하지 않는다 — argon2 해시만 저장/검증.
// (native 모듈이라 edge 런타임 아님. route handler = node 런타임에서만 사용)

export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export function verifyPassword(
  hashed: string,
  password: string,
): Promise<boolean> {
  return verify(hashed, password);
}
