// app/api/products/by-country-type/route.ts
import { NextRequest, NextResponse } from 'next/server';

const WP_URL = process.env.WP_URL;
const CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;

const authHeader = 'Basic ' + Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// Fetch products directly filtered by country from WooCommerce API
async function fetchProductsByCountry(countrySlug: string, status?: string) {
  // First, get the country term ID
  const termsUrl = `${WP_URL}/wp-json/wc/v3/products/attributes/6/terms?slug=${countrySlug}`;
  
  const termsResponse = await fetch(termsUrl, {
    headers: { 'Authorization': authHeader },
    next: { revalidate: 3600 } // Cache country terms for 1 hour
  });
  
  if (!termsResponse.ok) {
    console.error('Failed to fetch country term');
    return [];
  }
  
  const terms = await termsResponse.json();
  
  if (terms.length === 0) {
    console.log(`No term found for country: ${countrySlug}`);
    return [];
  }
  
  const termId = terms[0].id;
  console.log(`Found country term ID: ${termId} for ${countrySlug}`);
  
  // Now fetch products filtered by this attribute term
  let productsUrl = `${WP_URL}/wp-json/wc/v3/products?attribute=pa_country&attribute_term=${termId}&per_page=100`;
  
  // Add status filter if specified
  if (status) {
    productsUrl += `&status=${status}`;
  }
  
  const productsResponse = await fetch(productsUrl, {
    headers: { 'Authorization': authHeader },
    next: { revalidate: 300 } // Cache for 5 minutes
  });
  
  if (!productsResponse.ok) {
    console.error('Failed to fetch products');
    return [];
  }
  
  const products = await productsResponse.json();
  console.log(`✅ Fetched ${products.length} products for ${countrySlug} with status: ${status || 'all'}`);
  
  return products;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countrySlug = searchParams.get('country');
    const type = searchParams.get('type');
    
    if (!countrySlug) {
      return NextResponse.json(
        { error: 'Country parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`📦 Fetching products: country=${countrySlug}, type=${type}`);
    
    // Map type to WooCommerce status
    let status: string | undefined;
    if (type === 'public') {
      status = 'publish';
    } else if (type === 'private') {
      status = 'private';
    }
    
    // Fetch products filtered by country at the API level
    const products = await fetchProductsByCountry(countrySlug, status);
    
    const response = NextResponse.json({
      products,
      countryName: countrySlug
    });

    // Add cache headers
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    );

    return response;

  } catch (error: any) {
    console.error('❌ Products API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
