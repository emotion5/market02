import { Check } from "lucide-react";
import styles from "@/app/(plain)/signup/signup.module.css";

// 입력칸 오른쪽에 유효 입력 시 표시하는 체크. 자리는 항상 고정폭으로 예약해
// 유효/무효 전환 시 입력폭이 흔들리지 않게 한다. 개인·사업자 가입 폼 공용.
export default function OkCheck({ show }: { show: boolean }) {
  return (
    <span className={styles.okSlot}>
      {show && (
        <Check size={16} strokeWidth={2.5} className={styles.ok} aria-hidden />
      )}
    </span>
  );
}
