// 상품 폼의 카테고리 <select> 용 — 대분류 아래 중분류를 들여쓰기(↳)로 나열한다.
// 상품은 대·중분류 아무 레벨에나 붙을 수 있어 optgroup(선택 불가) 대신 평면 옵션을 쓴다.
export interface CatOption {
  slug: string;
  name: string;
  parentSlug?: string | null;
}

export function hierarchicalOptions<T extends CatOption>(
  cats: T[],
): { slug: string; label: string }[] {
  const out: { slug: string; label: string }[] = [];
  for (const top of cats.filter((c) => !c.parentSlug)) {
    out.push({ slug: top.slug, label: top.name });
    for (const child of cats.filter((c) => c.parentSlug === top.slug)) {
      out.push({ slug: child.slug, label: `↳ ${child.name}` });
    }
  }
  // 부모가 목록에 없는 고아(방어적)는 뒤에 그대로 붙인다.
  const placed = new Set(out.map((o) => o.slug));
  for (const c of cats) {
    if (!placed.has(c.slug)) out.push({ slug: c.slug, label: c.name });
  }
  return out;
}
