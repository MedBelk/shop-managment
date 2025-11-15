// lib/woocommerce.ts
const WP_URL = process.env.WP_URL;
const CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;

const authHeader = 'Basic ' + Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

export async function fetchWooCommerce(endpoint: string, options?: RequestInit) {
  const url = `${WP_URL}/wp-json/wc/v3${endpoint}`;
  
  console.log(`📡 API Request: ${options?.method || 'GET'} ${endpoint}`);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      ...options?.headers
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ API Error (${response.status}):`, errorText);
    throw new Error(`WooCommerce API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log(`✅ API Response: Success`);
  
  return data;
}
// lib/woocommerce.ts
let cachedProducts: any[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchAllWooCommerceProducts() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedProducts && (now - cacheTime) < CACHE_DURATION) {
    console.log('📦 Using cached products:', cachedProducts.length);
    return cachedProducts;
  }
  
  // Fetch fresh data
  const allProducts = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const products = await fetchWooCommerce(`/products?per_page=100&page=${page}`);
    
    if (products.length === 0) {
      hasMore = false;
    } else {
      allProducts.push(...products);
      console.log(`📦 Fetched page ${page}: ${products.length} products (total: ${allProducts.length})`);
      
      if (products.length < 100) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }
  
  // Update cache
  cachedProducts = allProducts;
  cacheTime = now;
  
  console.log(`✅ Total products fetched and cached: ${allProducts.length}`);
  return allProducts;
}
