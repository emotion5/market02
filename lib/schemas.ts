import { z } from "zod";
import { CATEGORIES, FEATURED_MAX } from "./constants";

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

// 홈 큐레이션(featured) 편성 (어드민) — 카테고리별 노출 상품 목록 전체를 순서대로 전송.
export const featuredUpdateSchema = z.object({
  categorySlug: z
    .string()
    .refine((s) => CATEGORY_SLUGS.includes(s), "카테고리를 선택하세요."),
  productIds: z
    .array(z.string())
    .max(FEATURED_MAX, `홈에는 카테고리당 최대 ${FEATURED_MAX}개까지 편성할 수 있습니다.`),
});
export type FeaturedUpdateInput = z.infer<typeof featuredUpdateSchema>;

// 사이트 설정(어드민) — 공급자·입금계좌·견적 유효기간·고객센터
const req = (max: number, msg: string) => z.string().trim().min(1, msg).max(max);
export const siteSettingsSchema = z.object({
  supplierName: req(100, "상호를 입력하세요."),
  supplierOwner: req(50, "대표자를 입력하세요."),
  supplierBizNo: req(20, "사업자등록번호를 입력하세요."),
  supplierAddress: req(200, "주소를 입력하세요."),
  supplierCategory: req(100, "업태/종목을 입력하세요."),
  supplierTel: req(30, "전화번호를 입력하세요."),
  bankName: req(30, "은행명을 입력하세요."),
  bankAccountNumber: req(50, "계좌번호를 입력하세요."),
  bankAccountHolder: req(50, "예금주를 입력하세요."),
  quoteValidDays: z
    .number()
    .int("정수여야 합니다.")
    .min(1, "1일 이상이어야 합니다.")
    .max(365, "365일 이하여야 합니다."),
  csEmail: z.email("올바른 이메일 형식이 아닙니다."),
  csTel: req(30, "고객센터 전화번호를 입력하세요."),
});
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

// 견적 발행(소비자) — 가격·번호·유효기한은 서버가 산정하므로 여기선 담지 않는다.
export const quoteDraftSchema = z.object({
  customer: z.object({
    company: z.string().trim().min(1, "상호를 입력하세요.").max(100),
    contactName: z.string().trim().max(50),
    contactTel: z.string().trim().max(30),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1),
        quantity: z.number().int().min(1).max(9999),
        color: z.string().max(20).optional(),
      }),
    )
    .min(1, "견적서에 담긴 상품이 없습니다."),
});
export type QuoteDraftSchemaInput = z.infer<typeof quoteDraftSchema>;
export type PersonalSignupInput = z.infer<typeof personalSignupSchema>;
export type BusinessSignupInput = z.infer<typeof businessSignupSchema>;
