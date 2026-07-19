import { prisma } from "@/server/db";
import { DEFAULT_SITE_SETTINGS } from "@/lib/constants";
import type { SiteSettings } from "@/lib/types";

// 사이트 설정 읽기/쓰기. 단일 행(id="default")만 사용하는 싱글턴.
// 마이그레이션에서 기본값으로 시드하지만, 행이 없어도 기본값으로 안전하게 동작한다.

const SINGLETON_ID = "default";

function toSettings(row: {
  supplierName: string;
  supplierOwner: string;
  supplierBizNo: string;
  supplierAddress: string;
  supplierCategory: string;
  supplierTel: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  quoteValidDays: number;
  csEmail: string;
  csTel: string;
}): SiteSettings {
  return {
    supplierName: row.supplierName,
    supplierOwner: row.supplierOwner,
    supplierBizNo: row.supplierBizNo,
    supplierAddress: row.supplierAddress,
    supplierCategory: row.supplierCategory,
    supplierTel: row.supplierTel,
    bankName: row.bankName,
    bankAccountNumber: row.bankAccountNumber,
    bankAccountHolder: row.bankAccountHolder,
    quoteValidDays: row.quoteValidDays,
    csEmail: row.csEmail,
    csTel: row.csTel,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await prisma.siteSetting.findUnique({
    where: { id: SINGLETON_ID },
  });
  return row ? toSettings(row) : DEFAULT_SITE_SETTINGS;
}

export async function updateSiteSettings(
  input: SiteSettings,
): Promise<SiteSettings> {
  const row = await prisma.siteSetting.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...input },
    update: input,
  });
  return toSettings(row);
}
