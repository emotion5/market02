import "server-only";
import type { TrackingResult, TrackingEvent } from "@/lib/tracking";
import { courierCodeByName, deliveryApiCodeByName } from "@/lib/couriers";

// 배송조회 provider 추상화 (세금계산서 provider와 동일한 격리 패턴).
// deliveryapi.co.kr / SweetTracker(live) / mock 을 같은 인터페이스로 교체한다.
// env TRACKING_PROVIDER=deliveryapi|sweettracker|mock 로 전환.
//   (미설정 시 기존 SWEETTRACKER_MODE=live 여부로 하위호환 판정)
//
// 이 모듈은 주문/결제/스키마와 결합하지 않는다: 택배사명 + trackingNumber 를 받아
// 정규화된 TrackingResult 를 돌려줄 뿐이며, 실패는 TrackingError 로만 알린다.
// 택배사명 → 각 provider 코드 변환은 어댑터 내부에서 처리한다(호출부는 코드체계를 모른다).

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
  courierName: string; // 저장된 택배사명(lib/couriers.ts 목록값)
  trackingNumber: string;
}

export interface ShipmentTracker {
  track(input: TrackInput): Promise<TrackingResult>;
}

const UNSUPPORTED = "실시간 조회를 지원하지 않는 배송입니다.";

// ── mock ──────────────────────────────────────────────
// 키 없이 화면·흐름을 검증할 수 있는 가짜 타임라인(배송중까지 진행된 상태).
function mockTrack({ courierName, trackingNumber }: TrackInput): Promise<TrackingResult> {
  const events: TrackingEvent[] = [
    { time: null, location: "이천 HUB", status: "집화완료" },
    { time: null, location: "옥천 HUB", status: "간선상차" },
    { time: null, location: "수신지 배송점", status: "배송출발" },
  ];
  return Promise.resolve({
    courierName: courierName || "택배",
    trackingNumber,
    level: 5,
    completed: false,
    currentStatus: "배송출발 (mock)",
    events,
  });
}

// ── deliveryapi.co.kr (live) ──────────────────────────
// POST https://api.deliveryapi.co.kr/v1/tracking/trace
//   Authorization: Bearer {API_KEY}:{SECRET_KEY}
//   body: { items: [{ courierCode, trackingNumber }] }
interface DeliveryApiProgress {
  dateTime?: string; // "2025-12-02 14:30"
  location?: string;
  status?: string;
  statusCode?: string;
}
interface DeliveryApiResult {
  success?: boolean;
  data?: {
    trackingNumber?: string;
    courierCode?: string;
    deliveryStatus?: string;
    deliveryStatusText?: string;
    isDelivered?: boolean;
    dateLastProgress?: string;
    progresses?: DeliveryApiProgress[];
  };
  error?: { code?: string; message?: string };
}
interface DeliveryApiResponse {
  isSuccess?: boolean;
  data?: { results?: DeliveryApiResult[] };
}

async function deliveryApiTrack({
  courierName,
  trackingNumber,
}: TrackInput): Promise<TrackingResult> {
  const courierCode = deliveryApiCodeByName(courierName);
  if (!courierCode) throw new TrackingError(400, UNSUPPORTED);

  const apiKey = process.env.DELIVERYAPI_API_KEY;
  const secretKey = process.env.DELIVERYAPI_SECRET_KEY;
  if (!apiKey || !secretKey) {
    throw new TrackingError(500, "배송조회 API 키가 설정되지 않았습니다.");
  }

  let json: DeliveryApiResponse;
  try {
    const res = await fetch("https://api.deliveryapi.co.kr/v1/tracking/trace", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}:${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items: [{ courierCode, trackingNumber }] }),
      cache: "no-store",
    });
    if (res.status === 401) throw new TrackingError(500, "배송조회 인증에 실패했습니다.");
    json = (await res.json()) as DeliveryApiResponse;
  } catch (e) {
    if (e instanceof TrackingError) throw e;
    throw new TrackingError(502, "배송조회 서비스에 연결하지 못했습니다.");
  }

  const result = json.data?.results?.[0];
  if (!result) throw new TrackingError(502, "배송조회 응답이 올바르지 않습니다.");
  // 건별 실패(조회불가·미지원 등)는 results[].success=false + error 로 온다.
  if (result.success === false || !result.data) {
    throw new TrackingError(404, result.error?.message || "배송 정보를 찾을 수 없습니다.");
  }

  const d = result.data;
  // "YYYY-MM-DD HH:mm" → ISO 유사('T' 삽입)해서 클라이언트 Date 파싱을 안정화.
  const events: TrackingEvent[] = (d.progresses ?? []).map((p) => ({
    time: p.dateTime ? p.dateTime.replace(" ", "T") : null,
    location: p.location ?? "",
    status: p.status ?? "",
  }));

  return {
    courierName,
    trackingNumber,
    level: d.isDelivered ? 6 : 3, // deliveryapi 는 level 미제공 → 완료여부로 근사
    completed: d.isDelivered === true || d.deliveryStatus === "DELIVERED",
    currentStatus: d.deliveryStatusText ?? "",
    events,
  };
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
  courierName,
  trackingNumber,
}: TrackInput): Promise<TrackingResult> {
  const courierCode = courierCodeByName(courierName);
  if (!courierCode) throw new TrackingError(400, UNSUPPORTED);

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
    courierName,
    trackingNumber,
    level,
    completed: data.complete === true || level >= 6,
    currentStatus: details[details.length - 1]?.kind ?? "",
    events,
  };
}

export function getTracker(): ShipmentTracker {
  const provider =
    process.env.TRACKING_PROVIDER ??
    (process.env.SWEETTRACKER_MODE === "live" ? "sweettracker" : "mock");
  switch (provider) {
    case "deliveryapi":
      return { track: deliveryApiTrack };
    case "sweettracker":
      return { track: sweetTrack };
    default:
      return { track: mockTrack };
  }
}
