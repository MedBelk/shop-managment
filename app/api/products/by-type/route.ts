// app/api/products/by-type/route.ts - Update the fetch calls
import { NextRequest, NextResponse } from 'next/server';

const WP_URL = process.env.WP_URL;
const CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;

type WooCategory = {
  name?: string;
};

type WooProduct = {
  name?: string;
  categories?: WooCategory[];
};

async function fetchProductsPaginated(
  status: string,
  headers: HeadersInit
): Promise<WooProduct[]> {
  const products: WooProduct[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${WP_URL}/wp-json/wc/v3/products?status=${status}&per_page=100&page=${page}`,
      {
        headers,
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch page ${page} (${response.status})`);
    }

    const batch: WooProduct[] = await response.json();
    products.push(...batch);

    if (batch.length < 100) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return products;
}

function buildCachedResponse(
  payload: unknown,
  maxAge = 300,
  staleWhileRevalidate = 600
) {
  const response = NextResponse.json(payload);
  response.headers.set(
    'Cache-Control',
    `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  );
  return response;
}

export async function GET(request: NextRequest) {
  if (!WP_URL || !CONSUMER_KEY || !CONSUMER_SECRET) {
    return NextResponse.json(
      { error: 'WooCommerce credentials are not configured' },
      { status: 500 }
    );
  }

  const authHeader =
    'Basic ' + Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const headers = { Authorization: authHeader };

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const countOnly = searchParams.get('count') === 'true';
  const getCategories = searchParams.get('categories') === 'true';

  try {
    if (getCategories) {
      console.log('📊 Fetching private products for category counts');
      const products = await fetchProductsPaginated('private', headers);

      let coins = 0;
      let banknotes = 0;

      products.forEach((product) => {
        const categories = product.categories || [];
        const categoryNames = categories.map((cat) =>
          String(cat?.name || '').toLowerCase()
        );
        const productName = String(product.name || '').toLowerCase();

        const isCoin =
          categoryNames.some(
            (name: string) => name.includes('coin') || name.includes('monnaie')
          ) || productName.includes('coin') || productName.includes('monnaie');

        const isBanknote =
          categoryNames.some(
            (name: string) => name.includes('banknote') || name.includes('billet')
          ) ||
          productName.includes('banknote') ||
          productName.includes('billet');

        if (isCoin) {
          coins++;
        } else if (isBanknote) {
          banknotes++;
        }
      });

      return buildCachedResponse({ coins, banknotes });
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter required' },
        { status: 400 }
      );
    }

    const status = type === 'public' ? 'publish' : 'private';

    if (countOnly) {
      console.log(`📊 Getting ${type} products count (head request)`);
      const response = await fetch(
        `${WP_URL}/wp-json/wc/v3/products?status=${status}&per_page=1`,
        {
          headers,
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        return NextResponse.json({ count: 0 });
      }

      const totalCount = response.headers.get('x-wp-total') || '0';
      const count = parseInt(totalCount, 10) || 0;

      return buildCachedResponse({ count }, 120, 300);
    }

    const allProducts = await fetchProductsPaginated(status, headers);
    return buildCachedResponse(allProducts, 120, 300);
  } catch (error) {
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
