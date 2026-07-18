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

export const personalSignupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, "이름을 입력하세요."),
  tel: z.string().optional(),
});

export const businessSignupSchema = personalSignupSchema.extend({
  bizNo: bizNoSchema,
  company: z.string().min(1, "상호를 입력하세요."),
  owner: z.string().optional(),
  licenseFileUrl: z.url("사업자등록증 파일 URL이 필요합니다."), // 업로드 후 URL
});

export type LoginInput = z.infer<typeof loginSchema>;
export type PersonalSignupInput = z.infer<typeof personalSignupSchema>;
export type BusinessSignupInput = z.infer<typeof businessSignupSchema>;
