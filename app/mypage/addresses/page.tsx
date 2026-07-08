"use client";

import { useEffect, useState } from "react";
import { MapPin, Trash2, Plus } from "lucide-react";
import styles from "./page.module.css";

interface Address {
  id: string;
  label: string; // 배송지명 (예: 회사, 창고)
  recipient: string;
  tel: string;
  address: string;
  isDefault: boolean;
}

const STORAGE_KEY = "market02-addresses";

function load(): Address[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Address[]) : [];
  } catch {
    return [];
  }
}

export default function AddressesPage() {
  const [list, setList] = useState<Address[] | null>(null);
  const [form, setForm] = useState({
    label: "",
    recipient: "",
    tel: "",
    address: "",
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setList(load());
  }, []);

  const persist = (next: Address[]) => {
    setList(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recipient.trim() || !form.address.trim()) return;
    const current = list ?? [];
    const newAddr: Address = {
      id: `addr-${current.length}-${form.recipient}-${form.tel}`,
      label: form.label.trim() || "배송지",
      recipient: form.recipient.trim(),
      tel: form.tel.trim(),
      address: form.address.trim(),
      isDefault: current.length === 0, // 첫 배송지는 기본으로
    };
    persist([...current, newAddr]);
    setForm({ label: "", recipient: "", tel: "", address: "" });
  };

  const removeAddress = (id: string) => {
    const next = (list ?? []).filter((a) => a.id !== id);
    // 기본 배송지를 지웠으면 첫 항목을 기본으로 승격
    if (next.length > 0 && !next.some((a) => a.isDefault)) {
      next[0].isDefault = true;
    }
    persist(next);
  };

  const setDefault = (id: string) => {
    persist((list ?? []).map((a) => ({ ...a, isDefault: a.id === id })));
  };

  if (list === null) {
    return <p className={styles.loading}>불러오는 중…</p>;
  }

  return (
    <div>
      <div className={styles.head}>
        <h2 className={styles.heading}>배송지 관리</h2>
        <p className={styles.subnote}>자주 쓰는 배송지를 등록해 두세요.</p>
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
          <Plus size={16} strokeWidth={2} />
          새 배송지 추가
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
            inputMode="tel"
            value={form.tel}
            onChange={(e) => setForm({ ...form, tel: e.target.value })}
          />
          <input
            className={`${styles.input} ${styles.addressInput}`}
            placeholder="주소"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
          />
        </div>
        <button type="submit" className={styles.addButton}>
          배송지 추가
        </button>
      </form>
    </div>
  );
}
