// app/api/attributes/quality/route.ts
import { fetchWooCommerce } from '@/lib/woocommerce';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Attribute ID 8 = Quality
    const qualities = await fetchWooCommerce('/products/attributes/8/terms?per_page=100');
    return NextResponse.json(qualities);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
