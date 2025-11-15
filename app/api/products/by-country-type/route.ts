// app/api/products/by-country-type/route.ts
import { fetchAllWooCommerceProducts } from '@/lib/woocommerce';
import { NextRequest, NextResponse } from 'next/server';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countrySlug = searchParams.get('country');
    const type = searchParams.get('type');
    
    console.log(`\n📦 Fetching products: country=${countrySlug}, type=${type}`);
    
    if (!countrySlug) {
      return NextResponse.json(
        { error: 'Country parameter is required' },
        { status: 400 }
      );
    }
    
    // Fetch ALL products with pagination
    const allProducts = await fetchAllWooCommerceProducts();
    
    // Filter by country and visibility type
    const filteredProducts = allProducts.filter((product: any) => {
      // Find the Country attribute
      const countryAttr = product.attributes?.find((attr: any) => 
        attr.name?.toLowerCase() === 'country' || 
        attr.slug === 'pa_country' ||
        attr.id === 6
      );
      
      if (!countryAttr || !countryAttr.options) {
        return false;
      }
      
      // Check if any option matches the country slug
      const matchesCountry = countryAttr.options.some((optionName: string) => 
        slugify(optionName) === countrySlug.toLowerCase()
      );
      
      if (!matchesCountry) {
        return false;
      }
      
      // Filter by visibility type
      if (type === 'public') {
        // Public = published status (not private/draft)
        return product.status === 'publish';
      } else if (type === 'private') {
        // Private = private post status
        return product.status === 'private';
      }
      
      return true;
    });
    
    console.log(`✅ Filtered to ${filteredProducts.length} ${type || 'all'} products for ${countrySlug}`);
    
    return NextResponse.json({
      products: filteredProducts,
      countryName: countrySlug
    });
  } catch (error: any) {
    console.error('❌ Products API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
