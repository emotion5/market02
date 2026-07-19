import { STATUS_LABEL, type OrderStatus } from "@/lib/orders";
import styles from "@/app/admin/admin.module.css";

const CLS: Record<OrderStatus, string> = {
  pending: styles.oPending,
  paid: styles.oPaid,
  preparing: styles.oPreparing,
  shipping: styles.oShipping,
  delivered: styles.oDelivered,
};

// 주문 상태 배지 (어드민 공유). 소비자 상태 라벨(STATUS_LABEL)과 동일 표기.
export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`${styles.oBadge} ${CLS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
