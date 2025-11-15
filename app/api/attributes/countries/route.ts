// app/api/attributes/countries/route.ts
import { fetchWooCommerce } from '@/lib/woocommerce';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🚀 Fetching all countries with pagination...');
    
    let allCountries: any[] = [];
    let page = 1;
    let hasMore = true;
    
    // Keep fetching until we get all countries
    while (hasMore) {
      const countries = await fetchWooCommerce(
        `/products/attributes/6/terms?per_page=100&page=${page}`
      );
      
      console.log(`📄 Page ${page}: Fetched ${countries.length} countries`);
      
      allCountries = [...allCountries, ...countries];
      
      // If we got less than 100, we're done
      if (countries.length < 100) {
        hasMore = false;
      } else {
        page++;
      }
    }
    
    console.log(`✅ Total countries fetched: ${allCountries.length}`);
    
    return NextResponse.json(allCountries);
  } catch (error: any) {
    console.error('❌ Countries API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
