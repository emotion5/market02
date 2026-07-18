"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/admin/admin.module.css";

interface Props {
  productId: string;
  repImage: string;
  gallery: { id: string; url: string }[];
}

export default function ProductImagesForm({
  productId,
  repImage: initRep,
  gallery: initGallery,
}: Props) {
  const router = useRouter();
  const [rep, setRep] = useState(initRep);
  const [gallery, setGallery] = useState(initGallery);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File, kind: "rep" | "gallery") {
    setError("");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "업로드에 실패했습니다.");
        return;
      }
      if (kind === "rep") setRep(data.repImage);
      else setGallery((g) => [...g, data.image]);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(imageId: string) {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/products/${productId}/images?imageId=${imageId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "삭제에 실패했습니다.");
        return;
      }
      setGallery((g) => g.filter((i) => i.id !== imageId));
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>대표 이미지</h2>
      <p className={styles.sectionDesc}>목록 카드·상세 상단에 표시됩니다.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.imgPreview} src={rep} alt="" />
      <label className={styles.fileBtn}>
        대표 이미지 변경
        <input
          className={styles.hiddenFile}
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f, "rep");
            e.target.value = "";
          }}
        />
      </label>

      <h2 className={styles.sectionTitle} style={{ marginTop: 28 }}>
        갤러리 이미지
      </h2>
      <p className={styles.sectionDesc}>상세 페이지 추가 이미지 (선택).</p>
      {gallery.length > 0 && (
        <div className={styles.galleryGrid}>
          {gallery.map((img) => (
            <div key={img.id} className={styles.galleryItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.galleryImg} src={img.url} alt="" />
              <button
                type="button"
                className={styles.galleryDel}
                onClick={() => remove(img.id)}
                disabled={busy}
                aria-label="삭제"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <label className={styles.fileBtn}>
        + 이미지 추가
        <input
          className={styles.hiddenFile}
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f, "gallery");
            e.target.value = "";
          }}
        />
      </label>

      {error && (
        <p className={styles.errorText} style={{ marginTop: 12 }}>
          {error}
        </p>
      )}
    </div>
  );
}
