"use client";

import { useEffect, useState } from "react";
import { MapPin, Trash2, Plus } from "lucide-react";
import AddressSearch from "@/components/AddressSearch";
import { formatPhone } from "@/lib/utils";
import styles from "./page.module.css";

interface Address {
  id: string;
  label: string;
  recipient: string;
  tel: string;
  address: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const [list, setList] = useState<Address[] | null>(null);
  const [form, setForm] = useState({ label: "", recipient: "", tel: "", address: "" });
  // 주소검색 컴포넌트를 초기화(제출 후 비우기)하기 위한 remount 키
  const [addrKey, setAddrKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/me/addresses")
      .then((res) => (res.ok ? res.json() : { addresses: [] }))
      .then((data) => {
        if (alive) setList(data.addresses ?? []);
      })
      .catch(() => {
        if (alive) setList([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recipient.trim() || !form.address.trim()) {
      setError("받는 분과 주소를 입력해주세요.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/me/addresses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "배송지 추가에 실패했습니다.");
        return;
      }
      setList(data.addresses ?? []);
      setForm({ label: "", recipient: "", tel: "", address: "" });
      setAddrKey((k) => k + 1); // 주소검색 입력칸 비우기
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const removeAddress = async (id: string) => {
    if (!confirm("이 배송지를 삭제할까요?")) return;
    const res = await fetch(`/api/me/addresses/${id}`, { method: "DELETE" });
    if (res.ok) setList((await res.json()).addresses ?? []);
    else alert("삭제에 실패했습니다.");
  };

  const setDefault = async (id: string) => {
    const res = await fetch(`/api/me/addresses/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "default" }),
    });
    if (res.ok) setList((await res.json()).addresses ?? []);
    else alert("처리에 실패했습니다.");
  };

  if (list === null) {
    return <p className={styles.loading}>불러오는 중…</p>;
  }

  return (
    <div>
      <div className={styles.head}>
        <h2 className={styles.heading}>배송지 관리</h2>
        <p className={styles.subnote}>
          자주 쓰는 배송지를 등록해 두면 주문할 때 바로 불러올 수 있습니다.
        </p>
      </div>

      {list.length > 0 && (
        <ul className={styles.addrList}>
          {list.map((a) => (
            <li key={a.id} className={styles.addrCard}>
              <div className={styles.addrTop}>
                <span className={styles.addrLabel}>
                  <MapPin size={14} strokeWidth={2} />
                  {a.label}
                  {a.isDefault && <span className={styles.defaultTag}>기본</span>}
                </span>
                <button
                  type="button"
                  className={styles.delete}
                  onClick={() => removeAddress(a.id)}
                  aria-label="배송지 삭제"
                >
                  <Trash2 size={16} strokeWidth={1.75} />
                </button>
              </div>
              <p className={styles.addrRecipient}>
                {a.recipient}
                {a.tel && <span className={styles.addrTel}> · {a.tel}</span>}
              </p>
              <p className={styles.addrText}>{a.address}</p>
              {!a.isDefault && (
                <button
                  type="button"
                  className={styles.setDefault}
                  onClick={() => setDefault(a.id)}
                >
                  기본 배송지로 설정
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form className={styles.form} onSubmit={addAddress}>
        <h3 className={styles.formTitle}>
          <Plus size={16} strokeWidth={2} />새 배송지 추가
        </h3>
        <div className={styles.formGrid}>
          <input
            className={styles.input}
            placeholder="배송지명 (예: 회사, 현장)"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
          <input
            className={styles.input}
            placeholder="받는 분"
            value={form.recipient}
            onChange={(e) => setForm({ ...form, recipient: e.target.value })}
            required
          />
          <input
            className={styles.input}
            placeholder="연락처"
            inputMode="numeric"
            value={form.tel}
            onChange={(e) => setForm({ ...form, tel: formatPhone(e.target.value) })}
          />
        </div>
        <div className={styles.addrSearchField}>
          <AddressSearch
            key={addrKey}
            inputClassName={styles.input}
            onChange={(addr) => setForm((f) => ({ ...f, address: addr }))}
          />
        </div>
        {error && <p className={styles.formError}>{error}</p>}
        <button type="submit" className={styles.addButton} disabled={busy}>
          {busy ? "추가 중…" : "배송지 추가"}
        </button>
      </form>
    </div>
  );
}
