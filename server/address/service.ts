import { prisma } from "@/server/db";
import type { AddressCreateInput } from "@/lib/schemas";

// 배송지(주소록) 도메인 — 계정(userId) 단위. 마이페이지 관리 + 체크아웃 불러오기에 사용.
// 불변식: 사용자당 기본배송지(isDefault=true)는 최대 1개.

export interface AddressRow {
  id: string;
  label: string;
  recipient: string;
  tel: string;
  address: string;
  isDefault: boolean;
}

function toRow(a: {
  id: string;
  label: string;
  recipient: string;
  tel: string;
  address: string;
  isDefault: boolean;
}): AddressRow {
  return {
    id: a.id,
    label: a.label,
    recipient: a.recipient,
    tel: a.tel,
    address: a.address,
    isDefault: a.isDefault,
  };
}

// 기본배송지 먼저, 그다음 등록순.
export async function listAddresses(userId: string): Promise<AddressRow[]> {
  const rows = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return rows.map(toRow);
}

export async function createAddress(
  userId: string,
  input: AddressCreateInput,
): Promise<AddressRow> {
  const count = await prisma.address.count({ where: { userId } });
  const makeDefault = input.isDefault === true || count === 0; // 첫 배송지는 자동 기본

  const created = await prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.address.create({
      data: {
        userId,
        label: input.label?.trim() || "배송지",
        recipient: input.recipient.trim(),
        tel: input.tel?.trim() || "",
        address: input.address.trim(),
        isDefault: makeDefault,
      },
    });
  });
  return toRow(created);
}

// 소유자 조건을 함께 걸어 남의 배송지는 못 지운다. 기본배송지를 지우면 다음 항목을 기본으로 승격.
export async function deleteAddress(
  userId: string,
  id: string,
): Promise<boolean> {
  const target = await prisma.address.findFirst({
    where: { id, userId },
    select: { isDefault: true },
  });
  if (!target) return false;

  await prisma.$transaction(async (tx) => {
    await tx.address.deleteMany({ where: { id, userId } });
    if (target.isDefault) {
      const next = await tx.address.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (next) {
        await tx.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
  });
  return true;
}

export async function setDefaultAddress(
  userId: string,
  id: string,
): Promise<boolean> {
  const target = await prisma.address.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!target) return false;

  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  return true;
}
