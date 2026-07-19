"use client";

import { createContext, useContext } from "react";
import type { SiteSettings } from "@/lib/types";
import { DEFAULT_SITE_SETTINGS } from "@/lib/constants";

// 서버(레이아웃)에서 읽은 사이트 설정을 클라이언트 트리에 주입한다.
// 클라이언트 컴포넌트(견적서·체크아웃 등)는 useSiteSettings() 로 읽는다.
const SiteSettingsContext = createContext<SiteSettings>(DEFAULT_SITE_SETTINGS);

export function SiteSettingsProvider({
  value,
  children,
}: {
  value: SiteSettings;
  children: React.ReactNode;
}) {
  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}
