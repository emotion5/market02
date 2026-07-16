"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "market02-auth";

// 이 프로젝트엔 실제 백엔드 세션이 없다. "로그인 상태"도 다른 목업 데이터처럼
// localStorage에 두고, 헤더 등 UI는 이 값을 읽어 버튼을 토글할 뿐이다.
// 진짜 인증(비밀번호 검증)은 서버가 붙는 단계에서 login()이 대체된다.
export interface AuthUser {
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // 서버 렌더(로그아웃 상태)와 첫 클라이언트 렌더를 맞추려고
    // localStorage 복원은 mount 이후에 한다 (하이드레이션 불일치 방지).
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setUser(JSON.parse(saved));
    } catch {
      // 저장된 값이 깨져 있으면 로그아웃 상태로 시작
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user, loaded]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoggedIn: user !== null,
      login: (email: string) => setUser({ email }),
      logout: () => setUser(null),
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있습니다.");
  return ctx;
}
