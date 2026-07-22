export function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
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
