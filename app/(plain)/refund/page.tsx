import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import PolicyDoc from "@/components/policy/PolicyDoc";

export const metadata: Metadata = {
  title: "환불정책 | MMM MARKET",
};

const EFFECTIVE_DATE = "2026년 7월 21일";

export default async function RefundPage() {
  const s = await getSiteSettings();
  const email = s.csEmail || "-";
  const tel = s.supplierTel || "-";

  return (
    <PolicyDoc title="청약철회 · 환불정책" effectiveDate={EFFECTIVE_DATE}>
      <p>
        본 정책은 「전자상거래 등에서의 소비자보호에 관한 법률」에 근거한
        청약철회, 반품, 교환 및 환불의 기준을 정합니다.
      </p>

      <h2>1. 청약철회(반품) 기간</h2>
      <ul>
        <li>
          이용자는 재화를 배송받은 날부터 <strong>7일 이내</strong>에 청약철회를
          할 수 있습니다.
        </li>
        <li>
          재화의 내용이 표시·광고 내용과 다르거나 계약 내용과 다르게 이행된
          경우에는, 재화를 공급받은 날부터 3개월 이내, 그 사실을 안 날 또는 알 수
          있었던 날부터 30일 이내에 청약철회를 할 수 있습니다.
        </li>
      </ul>

      <h2>2. 청약철회가 제한되는 경우</h2>
      <p>다음의 경우에는 이용자의 청약철회가 제한될 수 있습니다.</p>
      <ul>
        <li>이용자의 책임 있는 사유로 재화가 멸실되거나 훼손된 경우</li>
        <li>이용자의 사용 또는 일부 소비로 재화의 가치가 현저히 감소한 경우</li>
        <li>시간의 경과로 재판매가 곤란할 정도로 재화의 가치가 현저히 감소한 경우</li>
        <li>
          이용자의 주문에 따라 개별적으로 생산·재단·시공되는 재화 등으로서,
          청약철회 시 회사에 회복할 수 없는 중대한 피해가 예상되어 사전에 별도로
          고지하고 동의를 받은 경우
        </li>
      </ul>
      <p>
        다만 재화의 내용을 확인하기 위하여 포장 등을 훼손한 경우는 청약철회가
        제한되지 않습니다.
      </p>

      <h2>3. 환불 절차 및 시기</h2>
      <ul>
        <li>
          청약철회 접수 후 반품된 재화를 회수·확인하면, 회사는{" "}
          <strong>3영업일 이내</strong>에 이미 지급받은 대금을 환급합니다.
        </li>
        <li>
          신용카드 등으로 결제한 경우에는 결제대행사(PG)를 통해 결제 취소를
          요청하며, 카드사의 사정에 따라 취소 반영에 추가 기간이 소요될 수
          있습니다.
        </li>
        <li>
          무통장입금(가상계좌)으로 결제한 경우에는 이용자가 지정한 계좌로
          환급합니다.
        </li>
      </ul>

      <h2>4. 반품·교환 배송비 부담</h2>
      <table>
        <thead>
          <tr>
            <th>사유</th>
            <th>배송비 부담</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>단순 변심 등 이용자의 사유</td>
            <td>이용자 부담</td>
          </tr>
          <tr>
            <td>재화의 하자·오배송 등 회사의 사유</td>
            <td>회사 부담</td>
          </tr>
        </tbody>
      </table>

      <h2>5. 교환 안내</h2>
      <p>
        동일 상품의 색상·규격 교환은 재고 상황에 따라 가능하며, 교환이 어려운
        경우 환불로 처리될 수 있습니다. 하자로 인한 교환은 회사가 배송비를
        부담합니다.
      </p>

      <h2>6. 문의처</h2>
      <p>청약철회·반품·교환·환불에 관한 문의는 아래로 연락 주시기 바랍니다.</p>
      <ul>
        <li>전화: {tel}</li>
        <li>이메일: {email}</li>
      </ul>

      <h2>부칙</h2>
      <p>본 정책은 {EFFECTIVE_DATE}부터 시행합니다.</p>
    </PolicyDoc>
  );
}
