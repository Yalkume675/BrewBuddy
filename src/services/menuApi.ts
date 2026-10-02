import type { Drink } from "../types/drink";

const menu: Drink[] = [
  { id: 1, name: "Flat White", price: 8.5, category: "hot" },
  { id: 2, name: "Long Black", price: 7.0, category: "hot" },
  { id: 3, name: "Iced Latte", price: 9.5, category: "cold" },
];

export async function fetchMenu(): Promise<Drink[]> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return menu;
}