"use client";

import styles from "@/app/admin/admin.module.css";

// 상품정보제공고시 입력 (등록/수정 공용). 값은 문자열, 비우면 서버에서 null 저장.
export interface NoticeValues {
  modelName: string;
  origin: string;
  maker: string;
  dimensions: string;
  material: string;
  colorInfo: string;
  composition: string;
  certInfo: string;
}

export const EMPTY_NOTICE: NoticeValues = {
  modelName: "",
  origin: "",
  maker: "",
  dimensions: "",
  material: "",
  colorInfo: "",
  composition: "",
  certInfo: "",
};

const FIELDS: {
  key: keyof NoticeValues;
  label: string;
  placeholder?: string;
}[] = [
  { key: "modelName", label: "모델명" },
  { key: "origin", label: "제조국(원산지)", placeholder: "예: 대한민국 / 중국" },
  { key: "maker", label: "제조자 / 수입자" },
  { key: "dimensions", label: "크기·규격", placeholder: "예: 1200 × 600 × 8mm" },
  { key: "material", label: "재질 / 소재" },
  { key: "colorInfo", label: "색상" },
  { key: "composition", label: "구성품" },
  {
    key: "certInfo",
    label: "인증정보 (KC 등)",
    placeholder: "해당 시 기재. 비우면 '해당없음'으로 표시",
  },
];

export default function ProductNoticeFields({
  value,
  onChange,
}: {
  value: NoticeValues;
  onChange: (v: NoticeValues) => void;
}) {
  return (
    <div>
      <p className={styles.sectionDesc}>
        전자상거래 상품정보제공고시 — 상세페이지 하단 표로 노출됩니다. 비운 항목은
        &quot;상세페이지 참조&quot;로 표시되며, 품명·A/S·품질보증·배송/교환은 상품명과
        사이트 설정으로 자동 채워집니다.
      </p>
      {FIELDS.map((f) => (
        <div className={styles.field} key={f.key}>
          <label className={styles.label}>{f.label}</label>
          <input
            className={styles.input}
            value={value[f.key]}
            placeholder={f.placeholder}
            onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}
