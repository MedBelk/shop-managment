// app/api/products/private/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchWooCommerce } from '@/lib/woocommerce';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') || 'private';
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
  const perPageRaw = parseInt(searchParams.get('per_page') || '100', 10) || 100;
  const perPage = Math.min(Math.max(perPageRaw, 10), 100);

  try {
    const products = await fetchWooCommerce(
      `/products?status=${status}&per_page=${perPage}&page=${page}`
    );

    console.log(
      `📦 Fetched ${products.length} ${status} products (page ${page}, per_page ${perPage})`
    );

    const response = NextResponse.json(products);
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=120, stale-while-revalidate=300'
    );
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load products';
    console.error('Private products API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
