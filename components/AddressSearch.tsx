"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./AddressSearch.module.css";

// 카카오(다음) 우편번호 서비스 — B 방식(무의존, 공식 스크립트 직접 로드).
// 우편번호 + 도로명주소는 검색으로 채우고(읽기전용), 상세주소만 직접 입력받는다.
// 최종값은 "(우편번호) 도로명주소 상세주소" 한 문자열로 합쳐 onChange 로 올려보낸다.
// 회원가입·마이페이지 등에서도 재사용할 수 있게 host 폼의 input 스타일을 prop 으로 받는다.

const SCRIPT_SRC =
  "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

interface DaumPostcodeData {
  zonecode: string; // 우편번호(5자리)
  roadAddress: string; // 도로명주소
  jibunAddress: string; // 지번주소
}
interface DaumPostcodeInstance {
  open: () => void;
}
interface DaumPostcodeConstructor {
  new (options: {
    oncomplete: (data: DaumPostcodeData) => void;
  }): DaumPostcodeInstance;
}
declare global {
  interface Window {
    daum?: { Postcode: DaumPostcodeConstructor };
  }
}

// 스크립트는 페이지당 한 번만 로드한다(중복 삽입 방지).
let scriptPromise: Promise<void> | null = null;
function loadPostcodeScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.daum?.Postcode) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null; // 실패 시 다음 시도에서 재로딩할 수 있게 초기화
        reject(new Error("우편번호 서비스를 불러오지 못했습니다."));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

interface Parts {
  zonecode: string;
  base: string;
  detail: string;
}

function combine({ zonecode, base, detail }: Parts): string {
  const head = zonecode ? `(${zonecode}) ${base}` : base;
  return [head, detail]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

export default function AddressSearch({
  initialAddress,
  onChange,
  inputClassName,
}: {
  // 프리필용 기본주소(도로명). 비동기로 늦게 도착할 수 있어 effect 로 반영한다.
  initialAddress?: string;
  onChange: (combined: string) => void;
  inputClassName?: string;
}) {
  const [parts, setParts] = useState<Parts>({
    zonecode: "",
    base: "",
    detail: "",
  });
  const partsRef = useRef(parts); // effect 밖 최신값 참조(스테일 클로저 방지)
  const touchedRef = useRef(false); // 사용자가 검색/상세입력을 건드렸는지
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 상태 갱신 + 합친 값 상향 전달을 한곳에서 처리(effect 없이).
  const update = (patch: Partial<Parts>) => {
    const next = { ...partsRef.current, ...patch };
    partsRef.current = next;
    setParts(next);
    onChange(combine(next));
  };

  // 프리필 기본주소가 (늦게) 도착하면, 사용자가 아직 안 건드렸고 비어 있을 때만 채운다.
  useEffect(() => {
    if (initialAddress && !touchedRef.current && !partsRef.current.base) {
      update({ base: initialAddress });
    }
    // initialAddress 변화에만 반응(update 는 안정적 참조가 아니므로 의존성 제외)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAddress]);

  const openSearch = async () => {
    setError("");
    setLoading(true);
    try {
      await loadPostcodeScript();
      const Postcode = window.daum?.Postcode;
      if (!Postcode) throw new Error("우편번호 서비스를 불러오지 못했습니다.");
      new Postcode({
        oncomplete: (data) => {
          touchedRef.current = true;
          // 도로명주소 우선, 없으면 지번주소. 상세주소는 새로 입력하도록 비운다.
          update({
            zonecode: data.zonecode,
            base: data.roadAddress || data.jibunAddress,
            detail: "",
          });
        },
      }).open();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "우편번호 서비스를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <input
          className={`${inputClassName ?? ""} ${styles.zip}`.trim()}
          value={parts.zonecode}
          placeholder="우편번호"
          readOnly
        />
        <button
          type="button"
          className={styles.searchBtn}
          onClick={openSearch}
          disabled={loading}
        >
          {loading ? "불러오는 중…" : "주소 검색"}
        </button>
      </div>
      <input
        className={inputClassName}
        value={parts.base}
        placeholder="주소 검색을 눌러 도로명 주소를 선택하세요"
        readOnly
      />
      <input
        className={inputClassName}
        value={parts.detail}
        onChange={(e) => {
          touchedRef.current = true;
          update({ detail: e.target.value });
        }}
        placeholder="상세주소 (동/호/층 등)"
      />
      {error && <p className={styles.err}>{error}</p>}
    </div>
  );
}
