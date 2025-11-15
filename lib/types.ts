// lib/types.ts
export interface ProductAttribute {
  id: number;
  name: string;
  slug: string;
  options: string[];
}

export interface ProductImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  status: string;
  price: string;
  regular_price: string;
  attributes: ProductAttribute[];
  images?: ProductImage[]; // ← Add this line
}

export interface Country {
  id: number;
  name: string;
  slug: string;
  count: number;
}
