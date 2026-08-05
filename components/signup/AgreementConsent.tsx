import styles from "@/app/(plain)/signup/signup.module.css";

// 약관·개인정보 동의 블록 (가입 버튼 위). 개인·사업자 가입 폼 공용.
// 둘 다 필수 — 부모의 canSubmit 에서 agreeTerms && agreePrivacy 를 검사한다.
// 링크는 새창으로 전문(/terms, /privacy)을 띄우며, 클릭 시 체크박스가 토글되지 않게 한다.
export default function AgreementConsent({
  agreeTerms,
  agreePrivacy,
  setAgreeTerms,
  setAgreePrivacy,
}: {
  agreeTerms: boolean;
  agreePrivacy: boolean;
  setAgreeTerms: (v: boolean) => void;
  setAgreePrivacy: (v: boolean) => void;
}) {
  const agreeAll = agreeTerms && agreePrivacy;
  const toggleAll = (v: boolean) => {
    setAgreeTerms(v);
    setAgreePrivacy(v);
  };

  return (
    <div className={styles.consent}>
      <label className={styles.consentAll}>
        <input
          type="checkbox"
          checked={agreeAll}
          onChange={(e) => toggleAll(e.target.checked)}
        />
        <span>전체 동의하기</span>
      </label>
      <label className={styles.consentItem}>
        <input
          type="checkbox"
          checked={agreeTerms}
          onChange={(e) => setAgreeTerms(e.target.checked)}
        />
        <span>
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.consentLink}
            onClick={(e) => e.stopPropagation()}
          >
            이용약관
          </a>
          에 동의합니다. <span className={styles.consentReq}>(필수)</span>
        </span>
      </label>
      <label className={styles.consentItem}>
        <input
          type="checkbox"
          checked={agreePrivacy}
          onChange={(e) => setAgreePrivacy(e.target.checked)}
        />
        <span>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.consentLink}
            onClick={(e) => e.stopPropagation()}
          >
            개인정보 수집·이용
          </a>
          에 동의합니다. <span className={styles.consentReq}>(필수)</span>
        </span>
      </label>
    </div>
  );
}
