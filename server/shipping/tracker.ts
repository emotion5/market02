import "server-only";
import type { TrackingResult, TrackingEvent } from "@/lib/tracking";
import { courierNameByCode } from "@/lib/couriers";

// 배송조회 provider 추상화 (세금계산서 provider와 동일한 격리 패턴).
// 실제 연동(SweetTracker)과 로컬 검증용 mock 을 같은 인터페이스로 교체한다.
// env SWEETTRACKER_MODE=mock|live 로 전환 (기본 mock — 키 없이 로컬 흐름 검증).
//
// 이 모듈은 주문/결제/스키마와 결합하지 않는다: courierCode + trackingNumber 를 받아
// 정규화된 TrackingResult 를 돌려줄 뿐이며, 실패는 TrackingError 로만 알린다.

export class TrackingError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "TrackingError";
  }
}

export interface TrackInput {
  courierCode: string;
  trackingNumber: string;
}

export interface ShipmentTracker {
  track(input: TrackInput): Promise<TrackingResult>;
}

// ── mock ──────────────────────────────────────────────
// 키 없이 화면·흐름을 검증할 수 있는 가짜 타임라인(배송중까지 진행된 상태).
function mockTrack({ courierCode, trackingNumber }: TrackInput): Promise<TrackingResult> {
  const courierName = courierNameByCode(courierCode) ?? "택배";
  const events: TrackingEvent[] = [
    { time: null, location: "이천 HUB", status: "집화완료" },
    { time: null, location: "옥천 HUB", status: "간선상차" },
    { time: null, location: "수신지 배송점", status: "배송출발" },
  ];
  return Promise.resolve({
    courierName,
    trackingNumber,
    level: 5,
    completed: false,
    currentStatus: "배송출발 (mock)",
    events,
  });
}

// ── SweetTracker (live) ───────────────────────────────
// GET https://info.sweettracker.co.kr/api/v1/trackingInfo?t_key=KEY&t_code=CODE&t_invoice=INVOICE
interface SweetDetail {
  time?: number | null; // epoch ms
  timeString?: string;
  where?: string;
  kind?: string;
}
interface SweetResponse {
  status?: boolean; // 조회 성공 여부
  msg?: string;
  code?: string;
  level?: number;
  complete?: boolean;
  invoiceNo?: string;
  trackingDetails?: SweetDetail[];
}

async function sweetTrack({
  courierCode,
  trackingNumber,
}: TrackInput): Promise<TrackingResult> {
  const key = process.env.SWEETTRACKER_API_KEY;
  if (!key) throw new TrackingError(500, "배송조회 API 키가 설정되지 않았습니다.");

  const url =
    `https://info.sweettracker.co.kr/api/v1/trackingInfo` +
    `?t_key=${encodeURIComponent(key)}` +
    `&t_code=${encodeURIComponent(courierCode)}` +
    `&t_invoice=${encodeURIComponent(trackingNumber)}`;

  let data: SweetResponse;
  try {
    const res = await fetch(url, { cache: "no-store" });
    data = (await res.json()) as SweetResponse;
  } catch {
    throw new TrackingError(502, "배송조회 서비스에 연결하지 못했습니다.");
  }

  // SweetTracker 는 실패도 200 + {status:false, msg} 로 준다.
  if (data.status === false) {
    throw new TrackingError(404, data.msg || "배송 정보를 찾을 수 없습니다.");
  }

  const details = data.trackingDetails ?? [];
  const events: TrackingEvent[] = details.map((d) => ({
    time: d.time ? new Date(d.time).toISOString() : (d.timeString ?? null),
    location: d.where ?? "",
    status: d.kind ?? "",
  }));
  const level = data.level ?? 0;

  return {
    courierName: courierNameByCode(courierCode) ?? "택배",
    trackingNumber,
    level,
    completed: data.complete === true || level >= 6,
    currentStatus: details[details.length - 1]?.kind ?? "",
    events,
  };
}

export function getTracker(): ShipmentTracker {
  const mode = process.env.SWEETTRACKER_MODE ?? "mock";
  return { track: mode === "live" ? sweetTrack : mockTrack };
}
