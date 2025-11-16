import { NextRequest, NextResponse } from 'next/server';

const WP_URL = process.env.WP_URL;
const CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;
const authHeader = 'Basic ' + Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
}

const countryTermCache = new Map<string, number>();

async function getCountryTermId(countrySlug: string): Promise<number | null> {
  if (countryTermCache.has(countrySlug)) {
    console.log(`📋 Using cached term ID for ${countrySlug}`);
    return countryTermCache.get(countrySlug)!;
  }
  const url = `${WP_URL}/wp-json/wc/v3/products/attributes/6/terms?per_page=100`;
  try {
    const response = await fetch(url, { headers: { 'Authorization': authHeader }, next: { revalidate: 3600 } });
    if (!response.ok) return null;
    const terms = await response.json();
    terms.forEach((term: any) => countryTermCache.set(slugify(term.name), term.id));
    console.log(`✅ Cached ${terms.length} country terms`);
    return countryTermCache.get(countrySlug) || null;
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countrySlug = searchParams.get('country');
    const type = searchParams.get('type');
    if (!countrySlug) return NextResponse.json({ error: 'Country required' }, { status: 400 });
    
    console.log(`\n📦 Fetching ${type} products for: ${countrySlug}`);
    const termId = await getCountryTermId(countrySlug);
    if (!termId) {
      console.log(`⚠️ No term found`);
      return NextResponse.json({ products: [], countryName: countrySlug });
    }
    
    console.log(`✅ Term ID: ${termId}`);
    let apiUrl = `/products?attribute=pa_country&attribute_term=${termId}&per_page=100`;
    if (type === 'public') apiUrl += '&status=publish';
    if (type === 'private') apiUrl += '&status=private';
    
    console.log(`📡 API: ${apiUrl}`);
    const response = await fetch(`${WP_URL}/wp-json/wc/v3${apiUrl}`, {
      headers: { 'Authorization': authHeader },
      next: { revalidate: 300 }
    });
    
    if (!response.ok) return NextResponse.json({ products: [], countryName: countrySlug });
    const products = await response.json();
    console.log(`✅ Got ${products.length} products`);
    
    const result = NextResponse.json({ products, countryName: countrySlug });
    result.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return result;
  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
