// app/api/products/private/route.ts
import { fetchWooCommerce } from '@/lib/woocommerce';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch private products with images
    const products = await fetchWooCommerce('/products?status=private&per_page=100');
    
    console.log('📦 Fetched private products:', products.length);
    
    // Log first product to check images
    if (products.length > 0) {
      console.log('Sample product images:', products[0].images);
    }
    
    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Private products API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
