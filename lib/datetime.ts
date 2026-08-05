// KST(Asia/Seoul) 고정 날짜 포맷 — 서버(UTC)에서 렌더해도 한국 시각으로 표시한다.
// Vercel 서버리스는 UTC 로 동작하고 TZ 환경변수는 "예약"이라 바꿀 수 없으므로
// (https://vercel.com/docs/limits#reserved-variables), 포맷 시점에 타임존을 명시한다.
export const APP_TZ = "Asia/Seoul";

function partsOf(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    y: g("year"),
    m: g("month"),
    d: g("day"),
    hh: g("hour"),
    mi: g("minute"),
  };
}

// "YYYY.MM.DD HH:mm" (KST)
export function formatDateTime(iso: string | Date): string {
  const { y, m, d, hh, mi } = partsOf(
    typeof iso === "string" ? new Date(iso) : iso,
  );
  return `${y}.${m}.${d} ${hh}:${mi}`;
}

// "YYYY.MM.DD" (KST)
export function formatDate(iso: string | Date): string {
  const { y, m, d } = partsOf(typeof iso === "string" ? new Date(iso) : iso);
  return `${y}.${m}.${d}`;
}
