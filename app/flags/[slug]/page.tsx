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
  
  // Add/Remove product states
  const [newProduct, setNewProduct] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Load missing products from localStorage or API
  useEffect(() => {
    loadMissingProducts();
  }, [slug]);

  const loadMissingProducts = async () => {
    try {
      // First, check localStorage for custom missing products
      const stored = localStorage.getItem(`missing-${slug}`);
      
      if (stored) {
        setMissingProducts(JSON.parse(stored));
      } else {
        // Load from API if not in localStorage
        const response = await fetch(`/api/missing-products/${slug}`);
        const data = await response.json();
        setMissingProducts(data.missing || []);
      }
    } catch (error) {
      console.error('Error loading missing products:', error);
    }
  };

  useEffect(() => {
    // Fetch public and private products for this country
    Promise.all([
      fetch(`/api/products/by-country-type?country=${slug}&type=public`).then(r => r.json()),
      fetch(`/api/products/by-country-type?country=${slug}&type=private`).then(r => r.json()),
    ]).then(([publicData, privateData]) => {
      setPublicProducts(publicData.products || []);
      setPrivateProducts(privateData.products || []);
      setCountryName(publicData.countryName || privateData.countryName || slug);
      setLoading(false);
    }).catch(err => {
      console.error('Error loading data:', err);
      setLoading(false);
    });
  }, [slug]);

  // Add new missing product
  const handleAddProduct = () => {
    if (!newProduct.trim()) return;
    
    const updatedMissing = [...missingProducts, newProduct.trim()];
    setMissingProducts(updatedMissing);
    
    // Save to localStorage
    localStorage.setItem(`missing-${slug}`, JSON.stringify(updatedMissing));
    
    setNewProduct('');
    setIsAdding(false);
  };

  // Remove missing product
  const handleRemoveProduct = (productToRemove: string) => {
    const updatedMissing = missingProducts.filter(p => p !== productToRemove);
    setMissingProducts(updatedMissing);
    
    // Save to localStorage
    localStorage.setItem(`missing-${slug}`, JSON.stringify(updatedMissing));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
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
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl">❌</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{product}</h3>
                          <p className="text-sm text-gray-500 mt-1">Not in collection</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveProduct(product)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg"
                        title="Remove from list"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
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
