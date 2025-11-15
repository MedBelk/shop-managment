// app/api/categories/route.ts
import { fetchWooCommerce } from '@/lib/woocommerce';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const categories = await fetchWooCommerce('/products/categories?per_page=100');
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
