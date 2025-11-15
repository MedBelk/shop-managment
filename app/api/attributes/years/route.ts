// app/api/attributes/years/route.ts
import { fetchWooCommerce } from '@/lib/woocommerce';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Attribute ID 7 = Issue Year
    const years = await fetchWooCommerce('/products/attributes/7/terms?per_page=100');
    return NextResponse.json(years);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
