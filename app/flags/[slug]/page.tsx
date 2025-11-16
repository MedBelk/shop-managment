// app/flags/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { getCountryFlagUrl } from '@/lib/flags';

type Tab = 'public' | 'private' | 'missing';

export default function CountryDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [activeTab, setActiveTab] = useState<Tab>('public');
  const [publicProducts, setPublicProducts] = useState<Product[]>([]);
  const [privateProducts, setPrivateProducts] = useState<Product[]>([]);
  const [missingProducts, setMissingProducts] = useState<string[]>([]);
  const [countryName, setCountryName] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [newProduct, setNewProduct] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [movingProduct, setMovingProduct] = useState<string | null>(null);

  // Load data only once when slug changes
  useEffect(() => {
    let mounted = true;
    
    const loadAllData = async () => {
      setLoading(true);
      
      try {
        // Fetch all data in parallel
        const [publicData, privateData, missingData] = await Promise.all([
          fetch(`/api/products/by-country-type?country=${slug}&type=public`).then(r => r.json()),
          fetch(`/api/products/by-country-type?country=${slug}&type=private`).then(r => r.json()),
          fetch(`/api/missing-products/${slug}`).then(r => r.json())
        ]);
        
        if (!mounted) return; // Prevent state updates if component unmounted
        
        setPublicProducts(publicData.products || []);
        setPrivateProducts(privateData.products || []);
        setMissingProducts(missingData.missing || []);
        setCountryName(publicData.countryName || slug);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    loadAllData();
    
    // Cleanup function
    return () => {
      mounted = false;
    };
  }, [slug]); // Only re-run when slug changes

  // Add new missing product
  const handleAddProduct = () => {
    if (!newProduct.trim()) return;
    
    const updatedMissing = [...missingProducts, newProduct.trim()];
    setMissingProducts(updatedMissing);
    localStorage.setItem(`missing-${slug}`, JSON.stringify(updatedMissing));
    
    setNewProduct('');
    setIsAdding(false);
  };

  // Remove missing product
  const handleRemoveProduct = (productToRemove: string) => {
    const updatedMissing = missingProducts.filter(p => p !== productToRemove);
    setMissingProducts(updatedMissing);
    localStorage.setItem(`missing-${slug}`, JSON.stringify(updatedMissing));
  };

  // Move product to WooCommerce (optional - if you want this feature)
  const handleMoveToWooCommerce = async (productName: string, asPublic: boolean) => {
    setMovingProduct(productName);
    
    try {
      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productName,
          country: countryName,
          status: asPublic ? 'publish' : 'private',
          price: '',
        })
      });

      const data = await response.json();

      if (data.success) {
        // Remove from missing products
        const updatedMissing = missingProducts.filter(p => p !== productName);
        setMissingProducts(updatedMissing);
        localStorage.setItem(`missing-${slug}`, JSON.stringify(updatedMissing));

        // Reload products
        const newProducts = asPublic ? 
          await fetch(`/api/products/by-country-type?country=${slug}&type=public`).then(r => r.json()) :
          await fetch(`/api/products/by-country-type?country=${slug}&type=private`).then(r => r.json());
        
        if (asPublic) {
          setPublicProducts(newProducts.products || []);
        } else {
          setPrivateProducts(newProducts.products || []);
        }

        alert(`✅ Product "${productName}" added to ${asPublic ? 'Public' : 'Private'} collection!`);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error moving product:', error);
      alert('❌ Failed to create product');
    } finally {
      setMovingProduct(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="flex items-center gap-4">
              <div className="w-24 h-16 bg-gray-200 rounded animate-pulse"></div>
              <div>
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 w-40 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="aspect-3/2 bg-gray-200 animate-pulse"></div>
                <div className="p-4">
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const flagUrl = getCountryFlagUrl(countryName, 'h120');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/flags" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Flags
          </Link>
          
          <div className="flex items-center gap-4">
            <img
              src={flagUrl}
              alt={`${countryName} flag`}
              className="w-24 h-auto rounded shadow-md"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{countryName}</h1>
              <p className="text-gray-600 mt-1">
                {publicProducts.length + privateProducts.length} products in collection
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('public')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'public'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🌍 Public Collection
              <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                {publicProducts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('private')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'private'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🔒 Private Collection
              <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                {privateProducts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('missing')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'missing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📋 Missing / To Buy
              <span className="ml-2 bg-red-100 text-red-600 px-2 py-1 rounded-full text-sm">
                {missingProducts.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Public Products Tab */}
        {activeTab === 'public' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Public Collection</h2>
            {publicProducts.length === 0 ? (
              <p className="text-gray-500">No public products yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Private Products Tab */}
        {activeTab === 'private' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Private Collection</h2>
            {privateProducts.length === 0 ? (
              <p className="text-gray-500">No private products yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {privateProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Missing Products Tab */}
        {activeTab === 'missing' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Missing Products - To Buy</h2>
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <span className="text-xl">+</span>
                Add Product
              </button>
            </div>

            {/* Add Product Form */}
            {isAdding && (
              <div className="bg-white border-2 border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Add New Missing Product</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newProduct}
                    onChange={(e) => setNewProduct(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddProduct()}
                    placeholder="e.g., 500 lek"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddProduct}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setNewProduct('');
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Missing Products List */}
            {missingProducts.length === 0 ? (
              <p className="text-gray-500">No missing products listed</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {missingProducts.map((product, index) => (
                  <div
                    key={index}
                    className="bg-white border-2 border-red-200 rounded-lg p-4 hover:border-red-400 transition-colors group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">❌</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{product}</h3>
                        <p className="text-sm text-gray-500 mt-1">Not in collection</p>
                      </div>
                    </div>

                    {/* Action Buttons - Optional: Uncomment if you want to add products to WooCommerce */}
                    {/* <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleMoveToWooCommerce(product, false)}
                        disabled={movingProduct === product}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {movingProduct === product ? '⏳' : '🔒'} Add Private
                      </button>
                      <button
                        onClick={() => handleMoveToWooCommerce(product, true)}
                        disabled={movingProduct === product}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {movingProduct === product ? '⏳' : '🌍'} Add Public
                      </button>
                    </div> */}

                    <button
                      onClick={() => handleRemoveProduct(product)}
                      className="w-full mt-2 bg-red-100 hover:bg-red-200 text-red-600 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                      title="Remove from list"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Product Card Component
function ProductCard({ product }: { product: Product }) {
  const imageUrl = product.images?.[0]?.src || '/placeholder.png';
  
  return (
    <div className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="aspect-3/2 relative bg-gray-100">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
          {product.attributes?.map(attr => (
            <span
              key={attr.id}
              className="bg-gray-100 px-2 py-1 rounded"
            >
              {attr.options?.[0]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
