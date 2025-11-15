// app/api/test/connection/route.ts
import { fetchWooCommerce } from '@/lib/woocommerce';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test: Fetch product attributes
    const attributes = await fetchWooCommerce('/products/attributes');
    
    return NextResponse.json({
      success: true,
      message: 'Connection successful! ✅',
      attributesFound: attributes.length,
      attributes: attributes.map((a: any) => ({
        id: a.id,
        name: a.name,
        slug: a.slug
      }))
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Connection failed ❌',
      error: error.message
    }, { status: 500 });
  }
}
