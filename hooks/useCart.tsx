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
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // 서버 렌더 결과와 첫 클라이언트 렌더를 일치시키기 위해
    // localStorage 복원은 mount 이후에 한다 (하이드레이션 불일치 방지).
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setItems(JSON.parse(saved));
    } catch {
      // 저장된 값이 깨져 있으면 빈 장바구니로 시작
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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

    return {
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart: () => setItems([]),
      totalCount: items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart는 CartProvider 안에서만 사용할 수 있습니다.");
  return ctx;
}
