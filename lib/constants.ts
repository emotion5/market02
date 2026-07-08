import type { Category } from "./types";

export const CATEGORIES: Category[] = [
  { slug: "faucet", name: "수전" },
  { slug: "flooring", name: "바닥재" },
  { slug: "gangmaru", name: "강마루" },
  { slug: "jangpan", name: "장판" },
  { slug: "hardware", name: "하드웨어" },
  { slug: "drawer", name: "서랍" },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
