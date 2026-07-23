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
// categorySlug 유효성은 카테고리가 DB 기반이므로 정적 목록 대신 DB FK 로 보장한다.
export const productUpdateSchema = z.object({
  name: z.string().min(1, "상품명을 입력하세요.").max(100),
  categorySlug: z.string().min(1, "카테고리를 선택하세요.").max(50),
  summary: z.string().max(200).optional(),
  description: z.string().min(1, "설명을 입력하세요.").max(5000),
  price: z.number().int("금액은 정수여야 합니다.").min(0, "0 이상이어야 합니다."),
  isActive: z.boolean(),
  // 상품정보제공고시 (선택 — 비우면 상세에서 "상세페이지 참조"/"해당없음")
  modelName: z.string().max(100).optional(),
  origin: z.string().max(100).optional(),
  maker: z.string().max(100).optional(),
  dimensions: z.string().max(200).optional(),
  material: z.string().max(200).optional(),
  colorInfo: z.string().max(200).optional(),
  composition: z.string().max(300).optional(),
  certInfo: z.string().max(200).optional(),
});
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

// 상품 목록 인라인 수정(어드민) — 상품명·카테고리 + (단일 옵션 상품이면) 가격까지
// 한 번에 저장. price/wholesalePrice 는 단일 상품일 때만 함께 보낸다(옵션 상품은 옵션
// 편집화면에서). 상태·홈노출은 별도 즉시 토글이라 여기서 다루지 않는다.
export const productBasicsSchema = z.object({
  name: z.string().min(1, "상품명을 입력하세요.").max(100),
  categorySlug: z.string().min(1, "카테고리를 선택하세요.").max(50),
  price: z
    .number()
    .int("금액은 정수여야 합니다.")
    .min(0, "0 이상이어야 합니다.")
    .optional(),
  wholesalePrice: z
    .number()
    .int("금액은 정수여야 합니다.")
    .min(0, "0 이상이어야 합니다.")
    .nullable()
    .optional(),
});
export type ProductBasicsInput = z.infer<typeof productBasicsSchema>;

// 상품 목록에서 홈 노출(Featured) 즉시 토글.
export const productFeaturedSchema = z.object({ featured: z.boolean() });
export type ProductFeaturedInput = z.infer<typeof productFeaturedSchema>;

// 상품 목록에서 활성(쇼핑몰 노출) 상태 즉시 토글.
export const productActiveSchema = z.object({ active: z.boolean() });
export type ProductActiveInput = z.infer<typeof productActiveSchema>;

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
      z.object({
        hex: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/, "색상은 #RRGGBB 형식이어야 합니다."),
        name: z.string().trim().max(30),
      }),
    )
    .max(20),
});
export type ProductOptionsInput = z.infer<typeof productOptionsSchema>;

// 홈 큐레이션(featured) 편성 (어드민) — 카테고리별 노출 상품 목록 전체를 순서대로 전송.
export const featuredUpdateSchema = z.object({
  categorySlug: z.string().min(1, "카테고리를 선택하세요.").max(50),
  productIds: z.array(z.string()),
});
export type FeaturedUpdateInput = z.infer<typeof featuredUpdateSchema>;

// 카테고리 노출 설정(어드민) — 내비/홈 표시 토글 일괄 저장.
// 존재하지 않는 slug 는 서버(setCategoryVisibility)에서 조용히 무시한다.
export const categoryVisibilitySchema = z.object({
  categories: z
    .array(
      z.object({
        slug: z.string().min(1).max(50),
        showInNav: z.boolean(),
        showOnHome: z.boolean(),
      }),
    )
    .min(1),
});
export type CategoryVisibilityInput = z.infer<typeof categoryVisibilitySchema>;

// 카테고리 생성(어드민) — slug 는 생성 후 불변(상품ID·URL·이미지 폴더 키).
export const categoryCreateSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z][a-z0-9]*$/, "slug은 영문 소문자로 시작하고 영소문자·숫자만 쓸 수 있습니다.")
    .max(50),
  nameKo: z.string().trim().min(1, "한글 이름을 입력하세요.").max(30),
  nameEn: z.string().trim().min(1, "영문 이름을 입력하세요.").max(30),
  // 상위(대분류) slug. 없으면 대분류로 생성. 존재·깊이 검증은 서버(createCategory)에서.
  parentSlug: z.string().trim().max(50).optional(),
});
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;

// 카테고리 순서 저장(어드민) — 표시 순서대로 slug 목록 전체를 전송.
export const categoryReorderSchema = z.object({
  slugs: z.array(z.string().min(1).max(50)).min(1),
});
export type CategoryReorderInput = z.infer<typeof categoryReorderSchema>;

// 카테고리 수정(어드민) — 표시명·순서만(slug 변경 불가). 보낼 필드만 전송.
export const categoryUpdateSchema = z
  .object({
    nameKo: z.string().trim().min(1).max(30).optional(),
    nameEn: z.string().trim().min(1).max(30).optional(),
    sortOrder: z.number().int().min(0).max(9999).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "변경할 내용이 없습니다.");
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

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

// 주문 생성(소비자) — 가격·주문번호는 서버가 산정.
export const orderDraftSchema = z.object({
  orderer: z.object({
    name: z.string().trim().min(1, "받는 분을 입력하세요.").max(50),
    tel: z.string().trim().min(1, "연락처를 입력하세요.").max(30),
    address: z.string().trim().min(1, "배송지를 입력하세요.").max(200),
    memo: z.string().trim().max(200).optional(),
  }),
  depositor: z.string().trim().min(1, "입금자명을 입력하세요.").max(50),
  taxInvoice: z.object({
    requested: z.boolean(),
    bizNo: z.string().trim().max(20).optional(),
    company: z.string().trim().max(100).optional(),
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
    .min(1, "주문할 상품이 없습니다."),
});
export type OrderDraftSchemaInput = z.infer<typeof orderDraftSchema>;

// 주문 상태 전이(어드민)
export const orderActionSchema = z.object({
  action: z.enum([
    "confirm_deposit",
    "start_preparing",
    "start_shipping",
    "complete_delivery",
    "issue_tax_invoice",
  ]),
  courier: z.string().trim().max(50).optional(),
  trackingNumber: z.string().trim().max(50).optional(),
});
export type OrderActionInput = z.infer<typeof orderActionSchema>;
export type PersonalSignupInput = z.infer<typeof personalSignupSchema>;
export type BusinessSignupInput = z.infer<typeof businessSignupSchema>;
