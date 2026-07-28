import { orderStatusLabel, type OrderStatus } from "@/lib/orders";
import styles from "@/app/admin/admin.module.css";

const CLS: Record<OrderStatus, string> = {
  pending: styles.oPending,
  paid: styles.oPaid,
  preparing: styles.oPreparing,
  shipping: styles.oShipping,
  delivered: styles.oDelivered,
  cancelled: styles.oCancelled,
};

// 주문 상태 배지 (어드민 공유). 소비자 라벨과 동일 규칙:
// 취소 건은 결제·배송 이력으로 주문취소/환불완료/반품완료를 구분해 표기한다.
export default function OrderStatusBadge({
  status,
  paidAt,
  trackingNumber,
}: {
  status: OrderStatus;
  paidAt?: string | null;
  trackingNumber?: string | null;
}) {
  return (
    <span className={`${styles.oBadge} ${CLS[status]}`}>
      {orderStatusLabel({ status, paidAt, trackingNumber })}
    </span>
  );
}
