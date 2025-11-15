// app/api/products/by-country/route.ts (Better version with term lookup)
import { fetchWooCommerce } from '@/lib/woocommerce';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const countrySlug = searchParams.get('country');

    if (!countrySlug) {
      return NextResponse.json(
        { error: 'Country parameter is required' },
        { status: 400 }
      );
    }

    // Step 1: Get all country terms to find the term ID
    const countryTerms = await fetchWooCommerce('/products/attributes/6/terms?per_page=100');
    
    // Find the matching term
    const matchingTerm = countryTerms.find((term: any) => 
      term.slug.toLowerCase() === countrySlug.toLowerCase()
    );

    if (!matchingTerm) {
      // No matching term found, return empty array
      return NextResponse.json([]);
    }

    // Step 2: Try to fetch products using the term ID
    try {
      const products = await fetchWooCommerce(
        `/products?attribute=pa_country&attribute_term=${matchingTerm.id}&per_page=100`
      );
      
      if (products && products.length > 0) {
        return NextResponse.json(products);
      }
    } catch (apiError) {
      console.error('API filter failed, using manual filter');
    }

    // Step 3: Fallback - manual filtering
    const allProducts = await fetchWooCommerce('/products?per_page=100');
    
    const filteredProducts = allProducts.filter((product: any) => {
      const countryAttr = product.attributes.find(
        (attr: any) => attr.slug === 'pa_country'
      );
      
      if (!countryAttr) return false;
      
      return countryAttr.options.some((option: string) => 
        option.toLowerCase() === matchingTerm.name.toLowerCase()
      );
    });

    return NextResponse.json(filteredProducts);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
