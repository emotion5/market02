import { z } from "zod";

// 프론트·API 공용 입력 검증 스키마. (도메인이 늘면 phase 별로 여기에 추가)

// 사업자등록번호 000-00-00000
export const bizNoSchema = z
  .string()
  .regex(/^\d{3}-\d{2}-\d{5}$/, "사업자등록번호는 000-00-00000 형식이어야 합니다.");

export const emailSchema = z.email("올바른 이메일 형식이 아닙니다.");
export const passwordSchema = z.string().min(8, "비밀번호는 8자 이상이어야 합니다.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "비밀번호를 입력하세요."),
});

// 개인가입: 이메일+비밀번호만 (이름 등은 체크아웃에서 수집)
export const personalSignupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// 사업자가입: + 사업자등록번호. 상호·등록증파일은 가입 폼 미수집(추후 스토리지/프로필 연동).
export const businessSignupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  bizNo: bizNoSchema,
  company: z.string().min(1).optional(),
  licenseFileUrl: z.url().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type PersonalSignupInput = z.infer<typeof personalSignupSchema>;
export type BusinessSignupInput = z.infer<typeof businessSignupSchema>;
