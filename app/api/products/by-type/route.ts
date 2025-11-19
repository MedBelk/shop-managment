// app/api/products/by-type/route.ts - Update the fetch calls
import { NextRequest, NextResponse } from 'next/server';

const WP_URL = process.env.WP_URL;
const CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;
const authHeader = 'Basic ' + Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const countOnly = searchParams.get('count') === 'true';
  const getCategories = searchParams.get('categories') === 'true';

  try {
    // Get PRIVATE coins and banknotes counts
    if (getCategories) {
      console.log('📊 Fetching private products to count coins and banknotes...');
      
      const response = await fetch(
        `${WP_URL}/wp-json/wc/v3/products?status=private&per_page=100`,
        {
          headers: { 'Authorization': authHeader },
          cache: 'no-store' // ← NO CACHE for instant updates
        }
      );

      if (!response.ok) {
        return NextResponse.json({ coins: 0, banknotes: 0 });
      }

      const products = await response.json();
      
      let coins = 0;
      let banknotes = 0;

      products.forEach((product: any) => {
        const categories = product.categories || [];
        const categoryNames = categories.map((cat: any) => cat.name.toLowerCase());
        
        if (categoryNames.some((name: string) => name.includes('coin') || name.includes('monnaie'))) {
          coins++;
        } else if (categoryNames.some((name: string) => name.includes('banknote') || name.includes('billet'))) {
          banknotes++;
        } else {
          const productName = product.name.toLowerCase();
          if (productName.includes('coin') || productName.includes('monnaie')) {
            coins++;
          } else if (productName.includes('banknote') || productName.includes('billet')) {
            banknotes++;
          }
        }
      });

      console.log(`✅ Private Products: ${products.length} total`);
      console.log(`   - Coins: ${coins}`);
      console.log(`   - Banknotes: ${banknotes}`);
      
      return NextResponse.json({ coins, banknotes });
    }
    
    if (!type) {
      return NextResponse.json({ error: 'Type parameter required' }, { status: 400 });
    }

    const status = type === 'public' ? 'publish' : 'private';
    
    // Count only
    if (countOnly) {
      console.log(`📊 Getting ${type} products count (fast)...`);
      
      const response = await fetch(
        `${WP_URL}/wp-json/wc/v3/products?status=${status}&per_page=1`,
        {
          headers: { 'Authorization': authHeader },
          cache: 'no-store' // ← NO CACHE
        }
      );

      if (!response.ok) {
        return NextResponse.json({ count: 0 });
      }

      const totalCount = response.headers.get('x-wp-total') || '0';
      const count = parseInt(totalCount, 10);
      
      console.log(`✅ ${type} products count: ${count}`);
      
      return NextResponse.json({ count });
    }

    // Fetch all products
    let allProducts: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `${WP_URL}/wp-json/wc/v3/products?status=${status}&per_page=100&page=${page}`,
        {
          headers: { 'Authorization': authHeader },
          cache: 'no-store' // ← NO CACHE
        }
      );

      if (!response.ok) break;

      const products = await response.json();
      allProducts = [...allProducts, ...products];

      if (products.length < 100) {
        hasMore = false;
      } else {
        page++;
      }
    }

    return NextResponse.json(allProducts);
    
  } catch (error: any) {
    console.error('❌ API Error:', error);
    
    if (getCategories) {
      return NextResponse.json({ coins: 0, banknotes: 0 });
    }
    if (countOnly) {
      return NextResponse.json({ count: 0 });
    }
    return NextResponse.json([]);
  }
}
