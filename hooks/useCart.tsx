"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "market02-cart";

interface CartContextValue {
  items: CartItem[];
  loaded: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  replaceItems: (items: CartItem[]) => void;
  clearCart: () => void;
  totalCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // 견적서(장바구니)는 브라우저 세션 동안만 유지한다(sessionStorage).
    // 탭/브라우저를 닫으면 비워져, 오래 묵어 상품 정보가 어긋나는 일을 줄인다.
    // 서버 렌더 결과와 첫 클라이언트 렌더를 일치시키기 위해 복원은 mount 이후에 한다.
    try {
      // 과거 영구 저장(localStorage) 잔재는 정리 — 더는 사용하지 않는다.
      localStorage.removeItem(STORAGE_KEY);
      const saved = sessionStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setItems(JSON.parse(saved));
    } catch {
      // 저장된 값이 깨져 있으면 빈 장바구니로 시작
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const value = useMemo<CartContextValue>(() => {
    const addItem: CartContextValue["addItem"] = (item, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find(
          (i) => i.productId === item.productId && i.variantId === item.variantId,
        );
        if (existing) {
          return prev.map((i) =>
            i === existing ? { ...i, quantity: i.quantity + quantity } : i,
          );
        }
        return [...prev, { ...item, quantity }];
      });
    };

    const removeItem: CartContextValue["removeItem"] = (productId, variantId) => {
      setItems((prev) =>
        prev.filter((i) => !(i.productId === productId && i.variantId === variantId)),
      );
    };

    const updateQuantity: CartContextValue["updateQuantity"] = (
      productId,
      variantId,
      quantity,
    ) => {
      if (quantity < 1) return;
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId && i.variantId === variantId
            ? { ...i, quantity }
            : i,
        ),
      );
    };

    // 정합성 대조 결과 등으로 목록 전체를 교체한다(사라진 항목 제외·가격 갱신).
    const replaceItems: CartContextValue["replaceItems"] = (next) => {
      setItems(next);
    };

    return {
      items,
      loaded,
      addItem,
      removeItem,
      updateQuantity,
      replaceItems,
      clearCart: () => setItems([]),
      totalCount: items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    };
  }, [items, loaded]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart는 CartProvider 안에서만 사용할 수 있습니다.");
  return ctx;
}
