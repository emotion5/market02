// 배송조회 결과 타입 (클라이언트·서버 공용, 어댑터 세부와 무관한 도메인 형태).
// SweetTracker 등 어떤 provider를 쓰든 이 형태로 정규화한다.

export interface TrackingEvent {
  time: string | null; // ISO (파싱 실패 시 원문 문자열 또는 null)
  location: string; // 위치(집화지·터미널·배송점 등)
  status: string; // 처리 종류(집화완료·배송출발 등)
}

export interface TrackingResult {
  courierName: string;
  trackingNumber: string;
  level: number; // 진행 단계(1~6). SweetTracker level 기준.
  completed: boolean; // 배송완료 여부(level >= 6)
  currentStatus: string; // 최근 상태 텍스트
  events: TrackingEvent[]; // 시간순(오래된→최신)
}

// SweetTracker level → 라벨. 화면 표시용.
export const TRACK_LEVEL_LABEL: Record<number, string> = {
  1: "배송준비",
  2: "집화완료",
  3: "배송중",
  4: "지점 도착",
  5: "배송출발",
  6: "배송완료",
};
