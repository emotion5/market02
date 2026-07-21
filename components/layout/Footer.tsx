import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import styles from "./Footer.module.css";

// 통신판매업 신고 전이라 신고번호는 자리표시("준비중")로 둔다.
// 신고 후 SiteSetting에 필드를 추가해 이 값을 대체하면 된다.
const MAIL_ORDER_NO = "준비중";

// 전자상거래법 제10조(사업자 신원정보 표시)에 맞춘 사업자 정보 푸터.
// 값은 관리자에서 편집 가능한 SiteSetting을 그대로 노출한다.
export default function Footer({ settings }: { settings: SiteSettings }) {
  const bizNoDigits = settings.supplierBizNo.replace(/\D/g, "");
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.brand}>MMM MARKET</p>

        <nav className={styles.links}>
          <Link href="/terms">이용약관</Link>
          <Link className={styles.emphasis} href="/privacy">
            개인정보처리방침
          </Link>
          <Link href="/refund">환불정책</Link>
        </nav>

        <dl className={styles.info}>
          <div>
            <dt>상호</dt>
            <dd>{settings.supplierName}</dd>
          </div>
          <div>
            <dt>대표자</dt>
            <dd>{settings.supplierOwner}</dd>
          </div>
          <div>
            <dt>사업자등록번호</dt>
            <dd>
              {settings.supplierBizNo}
              {bizNoDigits && (
                <a
                  className={styles.bizCheck}
                  href={`https://www.ftc.go.kr/bizCommPop.do?wrkr_no=${bizNoDigits}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  사업자정보확인
                </a>
              )}
            </dd>
          </div>
          <div>
            <dt>통신판매업신고번호</dt>
            <dd>{MAIL_ORDER_NO}</dd>
          </div>
          <div>
            <dt>주소</dt>
            <dd>{settings.supplierAddress}</dd>
          </div>
          <div>
            <dt>전화</dt>
            <dd>{settings.supplierTel}</dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>{settings.csEmail}</dd>
          </div>
          <div>
            <dt>개인정보보호책임자</dt>
            <dd>{settings.supplierOwner}</dd>
          </div>
        </dl>

        <p className={styles.copyright}>
          © MMM MARKET. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
