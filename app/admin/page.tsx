import { redirect } from "next/navigation";

// 어드민 진입 시 회원 승인 화면으로 이동.
export default function AdminHome() {
  redirect("/admin/members");
}
