// lib/woocommerce.ts

const WP_URL = process.env.WP_URL;
const CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;

const authHeader = 'Basic ' + Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

// Cache configuration
let cachedProducts: any[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Main fetch function for WooCommerce API
 */
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
    cache: options?.method === 'GET' ? 'default' : 'no-store',
    next: { revalidate: 300 }
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

/**
 * Fetch all products with in-memory caching and pagination
 */
export async function fetchAllWooCommerceProducts() {
  const now = Date.now();
  
  if (cachedProducts && (now - cacheTime) < CACHE_DURATION) {
    const cacheAge = Math.round((now - cacheTime) / 1000);
    console.log(`📦 Using cached products: ${cachedProducts.length} (cached ${cacheAge}s ago)`);
    return cachedProducts;
  }
  
  console.log('🔄 Cache expired or empty, fetching fresh data from WooCommerce...');
  
  const allProducts = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    try {
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
    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error);
      hasMore = false;
    }
  }
  
  cachedProducts = allProducts;
  cacheTime = now;
  
  console.log(`✅ Total products fetched and cached: ${allProducts.length}`);
  console.log(`⏰ Cache will expire in ${CACHE_DURATION / 1000 / 60} minutes`);
  
  return allProducts;
}

/**
 * Clear the product cache manually
 */
export function clearProductCache() {
  cachedProducts = null;
  cacheTime = 0;
  console.log('🗑️ Product cache cleared');
}

/**
 * Get cache status
 */
export function getCacheStatus() {
  const now = Date.now();
  const isValid = cachedProducts && (now - cacheTime) < CACHE_DURATION;
  const cacheAge = cachedProducts ? Math.round((now - cacheTime) / 1000) : 0;
  
  return {
    isCached: !!cachedProducts,
    isValid,
    productCount: cachedProducts?.length || 0,
    cacheAge,
    expiresIn: isValid ? Math.round((CACHE_DURATION - (now - cacheTime)) / 1000) : 0
  };
}
