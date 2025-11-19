// app/flags/[slug]/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
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
  const capitalizeWords = (text: string) => {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [attributeFilters, setAttributeFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<'name' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Missing products states
  const [newProduct, setNewProduct] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Load data only once on mount or when slug changes
  useEffect(() => {
    let mounted = true;
    
    const loadAllData = async () => {
      setLoading(true);
      console.log(`⏱️ Loading data for ${slug}...`);
      const startTime = Date.now();
      
      try {
        // These API calls are FAST because they filter at WooCommerce level
        const [publicData, privateData, missingData] = await Promise.all([
          fetch(`/api/products/by-country-type?country=${slug}&type=public`).then(r => r.json()),
          fetch(`/api/products/by-country-type?country=${slug}&type=private`).then(r => r.json()),
          fetch(`/api/missing-products/${slug}`).then(r => r.json())
        ]);
        
        if (!mounted) return;
        
        const elapsed = Date.now() - startTime;
        console.log(`✅ Data loaded in ${elapsed}ms`);
        
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
    
    return () => {
      mounted = false;
    };
  }, [slug]);

  // Reset filters when changing tabs
  useEffect(() => {
    setSearchTerm('');
    setCategoryFilter('all');
    setAttributeFilters({});
  }, [activeTab]);

  const currentProducts = activeTab === 'public' ? publicProducts : privateProducts;

  // Extract available categories (memoized)
  const availableCategories = useMemo(() => {
    const categoriesSet = new Set<string>();
    
    currentProducts.forEach(product => {
      if (Array.isArray(product.categories) && product.categories.length > 0) {
        product.categories.forEach(cat => {
          if (cat?.name) {
            categoriesSet.add(cat.name);
          }
        });
      }
    });
    
    return Array.from(categoriesSet).sort();
  }, [currentProducts]);

  // Extract all unique attributes (memoized)
  const availableAttributes = useMemo(() => {
    const attributesMap = new Map<string, Set<string>>();

    currentProducts.forEach(product => {
      product.attributes?.forEach(attr => {
        if (attr.name && attr.options) {
          const attrNameLower = attr.name.toLowerCase();
          if (attrNameLower === 'country' || attrNameLower === 'pays') {
            return;
          }

          if (!attributesMap.has(attr.name)) {
            attributesMap.set(attr.name, new Set());
          }
          
          attr.options.forEach(option => {
            attributesMap.get(attr.name)?.add(option);
          });
        }
      });
    });

    const result: Array<{ name: string; values: string[] }> = [];
    attributesMap.forEach((values, name) => {
      result.push({
        name,
        values: Array.from(values).sort()
      });
    });

    return result;
  }, [currentProducts]);

  // Filter and sort products (all client-side, but on already-filtered data)
  const filteredProducts = useMemo(() => {
    console.log(`🔍 Filtering ${currentProducts.length} products...`);
    
    let filtered = currentProducts.filter(product => {
      // Search filter
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all') {
        const matchesCategory = Array.isArray(product.categories) && 
          product.categories.some(cat => cat?.name === categoryFilter);
        if (!matchesCategory) return false;
      }

      // Attribute filters
      for (const [attrName, filterValue] of Object.entries(attributeFilters)) {
        if (filterValue === 'all') continue;

        const hasMatch = product.attributes?.some(attr =>
          attr.name === attrName && attr.options?.includes(filterValue)
        );

        if (!hasMatch) return false;
      }

      return true;
    });

    // Sort products
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      if (sortBy === 'name') {
        compareValue = a.name.localeCompare(b.name);
      } else if (sortBy === 'price') {
        const priceA = parseFloat(a.price || '0');
        const priceB = parseFloat(b.price || '0');
        compareValue = priceA - priceB;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    console.log(`✅ Filtered to ${filtered.length} products`);
    return filtered;
  }, [currentProducts, searchTerm, categoryFilter, attributeFilters, sortBy, sortOrder]);

  // Get all attribute values for display in table
  const getProductAttributes = (product: Product) => {
    const attrs: Record<string, string> = {};
    product.attributes?.forEach(attr => {
      if (attr.name) {
        const attrNameLower = attr.name.toLowerCase();
        if (attrNameLower !== 'country' && attrNameLower !== 'pays') {
          attrs[attr.name] = attr.options?.[0] || '-';
        }
      }
    });
    return attrs;
  };

  // Missing products handlers
  const handleAddProduct = () => {
    if (!newProduct.trim()) return;
    const updatedMissing = [...missingProducts, newProduct.trim()];
    setMissingProducts(updatedMissing);
    localStorage.setItem(`missing-${slug}`, JSON.stringify(updatedMissing));
    setNewProduct('');
    setIsAdding(false);
  };

  const handleRemoveProduct = (productToRemove: string) => {
    const updatedMissing = missingProducts.filter(p => p !== productToRemove);
    setMissingProducts(updatedMissing);
    localStorage.setItem(`missing-${slug}`, JSON.stringify(updatedMissing));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading {slug} products...</p>
          <p className="mt-2 text-sm text-gray-500">This should only take 1-2 seconds</p>
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
            <h1 className="text-3xl font-bold text-gray-900">
              {capitalizeWords(countryName)}
            </h1>
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
        {/* Products Table (Public & Private) */}
        {(activeTab === 'public' || activeTab === 'private') && (
          <div>
            {/* Filters */}
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg mb-6 border border-blue-100">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border-2 border-blue-200 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-gray-900 placeholder-gray-500 font-medium"
                  />
                  <svg className="w-5 h-5 text-blue-500 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Category Filter */}
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full border-2 border-pink-200 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white shadow-sm text-gray-900 font-medium appearance-none cursor-pointer hover:border-pink-300 transition-colors"
                  >
                    <option value="all" className="text-gray-900 font-semibold">
                      📂 All Categories
                    </option>
                    {availableCategories.map(category => (
                      <option key={category} value={category} className="text-gray-800 font-medium">
                        {category}
                      </option>
                    ))}
                  </select>
                  <svg className="w-5 h-5 text-pink-500 absolute right-3 top-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Dynamic Attribute Filters */}
                {availableAttributes.slice(0, 2).map(attr => (
                  <div key={attr.name} className="relative">
                    <select
                      value={attributeFilters[attr.name] || 'all'}
                      onChange={(e) => setAttributeFilters({
                        ...attributeFilters,
                        [attr.name]: e.target.value
                      })}
                      className="w-full border-2 border-purple-200 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm text-gray-900 font-medium appearance-none cursor-pointer hover:border-purple-300 transition-colors"
                    >
                      <option value="all" className="text-gray-900 font-semibold">
                        All {attr.name} ✨
                      </option>
                      {attr.values.map(value => (
                        <option key={value} value={value} className="text-gray-800 font-medium">
                          {value}
                        </option>
                      ))}
                    </select>
                    <svg className="w-5 h-5 text-purple-500 absolute right-3 top-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                ))}

                {/* Sort */}
                <div className="flex gap-2">
                  
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="border-2 border-green-200 bg-white hover:bg-green-50 rounded-lg px-4 py-3 font-bold text-green-600 shadow-sm transition-all hover:shadow-md active:scale-95"
                    title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    {sortOrder === 'asc' ? '↑ A-Z' : '↓ Z-A'}
                  </button>
                </div>
              </div>

              {/* Results Info */}
              <div className="mt-4 flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-lg px-4 py-3 border border-blue-100">
                <div className="text-sm font-semibold text-gray-700">
                  <span className="text-blue-600 text-lg">{filteredProducts.length}</span>
                  <span className="text-gray-500"> of </span>
                  <span className="text-gray-700">{currentProducts.length}</span>
                  <span className="text-gray-500"> products</span>
                </div>
                {availableAttributes.length > 0 && (
                  <div className="text-sm font-medium text-purple-600 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {availableAttributes.length} filter{availableAttributes.length !== 1 ? 's' : ''} available
                  </div>
                )}
              </div>

              {/* Clear Filters Button */}
              {(searchTerm || categoryFilter !== 'all' || Object.values(attributeFilters).some(v => v !== 'all')) && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('all');
                      setAttributeFilters({});
                    }}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>

           {/* Table */}
<div className="bg-white rounded-lg shadow overflow-hidden">
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Image
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Name
          </th>
          {/* Dynamic attribute columns */}
          {availableAttributes.map(attr => (
            <th key={attr.name} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {attr.name}
            </th>
          ))}
          {/* Conditional last column based on active tab */}
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            {activeTab === 'private' ? 'Source' : 'Price'}
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {filteredProducts.length === 0 ? (
          <tr>
            <td colSpan={3 + availableAttributes.length} className="px-6 py-12 text-center text-gray-500">
              {currentProducts.length === 0 ? 'No products in this collection' : 'No products found matching your filters'}
            </td>
          </tr>
        ) : (
          filteredProducts.map(product => {
            const attrs = getProductAttributes(product);
            return (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <img
                    src={product.images?.[0]?.src || '/placeholder.png'}
                    alt={product.name}
                    className="h-16 w-16 object-cover rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                </td>
                {/* Dynamic attribute values */}
                {availableAttributes.map(attr => (
                  <td key={attr.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {attrs[attr.name] || '-'}
                  </td>
                ))}
                {/* Conditional last column - Source for Private, Price for Public */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {activeTab === 'private' ? (
                    // Show Source for private products
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {getAttributeValue(product, 'source') || getAttributeValue(product, 'Source') || '-'}
                    </span>
                  ) : (
                    // Show Price for public products
                    <span className="font-medium text-gray-900">
                      {product.price ? `$${product.price}` : '-'}
                    </span>
                  )}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
</div>
          </div>
        )}

        {/* Missing Products Tab - Keep existing code */}
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
                    <button
                      onClick={() => handleRemoveProduct(product)}
                      className="w-full mt-2 bg-red-100 hover:bg-red-200 text-red-600 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
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
