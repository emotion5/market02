import { z } from "zod";
import { CATEGORIES } from "./constants";

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

// 회원정보 수정 (변경할 필드만 전송)
export const profileUpdateSchema = z.object({
  name: z.string().max(50).optional(),
  tel: z.string().max(30).optional(),
  company: z.string().max(100).optional(),
  newPassword: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.").optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// 상품 수정 (어드민) — 상품 레벨 필드. 옵션(variant) 가격은 별도.
const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);
export const productUpdateSchema = z.object({
  name: z.string().min(1, "상품명을 입력하세요.").max(100),
  categorySlug: z
    .string()
    .refine((s) => CATEGORY_SLUGS.includes(s), "카테고리를 선택하세요."),
  summary: z.string().max(200).optional(),
  description: z.string().min(1, "설명을 입력하세요.").max(5000),
  price: z.number().int("금액은 정수여야 합니다.").min(0, "0 이상이어야 합니다."),
  isActive: z.boolean(),
});
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

// 상품 옵션(variant)·색상 편집 (어드민). 목록 전체를 보내 동기화.
export const productOptionsSchema = z.object({
  variants: z
    .array(
      z.object({
        id: z.string().optional(), // 기존 옵션이면 id, 새 옵션이면 없음
        name: z.string().min(1, "옵션명을 입력하세요.").max(60),
        price: z.number().int().min(0),
        wholesalePrice: z.number().int().min(0).nullable(),
      }),
    )
    .min(1, "옵션이 최소 1개 필요합니다."),
  colors: z
    .array(
      z.string().regex(/^#[0-9a-fA-F]{6}$/, "색상은 #RRGGBB 형식이어야 합니다."),
    )
    .max(20),
});
export type ProductOptionsInput = z.infer<typeof productOptionsSchema>;
export type PersonalSignupInput = z.infer<typeof personalSignupSchema>;
export type BusinessSignupInput = z.infer<typeof businessSignupSchema>;
