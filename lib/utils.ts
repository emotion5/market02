export function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}

// 전화번호 입력 자동 하이픈. 휴대폰(010)·유선(02/0XX) 흔한 형태를 처리한다.
//  - 02(서울): 2-3-4 또는 2-4-4
//  - 그 외: 3-3-4 또는 3-4-4 (휴대폰·지방 유선)
// 표시/저장 편의용이며 엄격한 유효성 검사는 아니다(숫자만 남겨 최대 11자리).
export function formatPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.startsWith("02")) {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
  }
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

// 원본 이미지 경로/URL → 파생 경량 썸네일 경로(.thumb.webp).
// 로컬 정적 경로("/images/...")와 Supabase 공개 URL 모두 순수 문자열 치환으로
// 처리한다. 썸네일 파일이 없으면 <img onError>가 원본으로 폴백하므로,
// 파생 파일이 아직 없는 과거 견적서도 안전하게 원본을 표시한다.
const IMG_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;

export function thumbUrl(src: string): string {
  if (!src || /\.thumb\.webp$/i.test(src) || !IMG_EXT.test(src)) return src;
  return src.replace(IMG_EXT, ".thumb.webp");
}

// 원본 이미지 경로/URL → 파생 중간 썸네일 경로(.med.webp, 600px).
// 상품 카드·목록·상세 썸네일에서 원본(1600px master) 대신 불러 전송량을 줄인다.
// thumbUrl 과 동일하게, 파일이 없으면 <img onError>가 원본으로 폴백한다.
export function mediumUrl(src: string): string {
  if (!src || /\.(thumb|med)\.webp$/i.test(src) || !IMG_EXT.test(src)) return src;
  return src.replace(IMG_EXT, ".med.webp");
}
