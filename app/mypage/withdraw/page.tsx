"use client";

import { useState } from "react";
import styles from "./page.module.css";

// 탈퇴 시 정리할 로컬 데이터 키
const CLEAR_KEYS = [
  "market02-cart",
  "market02-orders",
  "market02-addresses",
  "market02-profile",
];

export default function WithdrawPage() {
  const [agreed, setAgreed] = useState(false);
  const [done, setDone] = useState(false);

  const handleWithdraw = () => {
    if (!agreed) return;
    // TODO: 백엔드 연동 (회원 탈퇴 처리) — 현재는 로컬 데이터만 정리
    CLEAR_KEYS.forEach((k) => localStorage.removeItem(k));
    setDone(true);
  };

  if (done) {
    return (
      <div className={styles.doneBox}>
        <h2 className={styles.doneTitle}>탈퇴가 완료되었습니다.</h2>
        <p className={styles.doneText}>
          그동안 이용해 주셔서 감사합니다.
        </p>
        <button
          type="button"
          className={styles.homeButton}
          onClick={() => (window.location.href = "/")}
        >
          홈으로
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.head}>
        <h2 className={styles.heading}>회원 탈퇴</h2>
        <p className={styles.subnote}>탈퇴 전 아래 내용을 확인해주세요.</p>
      </div>

      <div className={styles.warnBox}>
        <p className={styles.warnTitle}>탈퇴 시 유의사항</p>
        <ul className={styles.warnList}>
          <li>회원 정보 및 등록된 배송지가 모두 삭제됩니다.</li>
          <li>진행 중인 주문(입금대기·배송 중)이 있으면 탈퇴가 제한될 수 있습니다.</li>
          <li>세금계산서 발급 이력 등 법령상 보관 의무가 있는 자료는 관련 기간 동안 보관됩니다.</li>
          <li>탈퇴 후에는 동일 사업자등록번호로 재가입 시 승인 절차를 다시 거쳐야 합니다.</li>
        </ul>
      </div>

      <label className={styles.agree}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        위 유의사항을 확인하였으며, 회원 탈퇴에 동의합니다.
      </label>

      <button
        type="button"
        className={styles.withdrawButton}
        disabled={!agreed}
        onClick={handleWithdraw}
      >
        회원 탈퇴
      </button>
    </div>
  );
}
