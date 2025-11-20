// app/flags/[slug]/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { getCountryFlagUrl } from '@/lib/flags';

type Tab = 'public' | 'private' | 'missing';
type SortBy = 'name' | 'price' | 'year';

const STORAGE_PREFIX = 'missing-';

const capitalizeWords = (text: string) =>
  text
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const formatPrice = (value: string) => {
  const numericValue = Number.parseFloat(value || '0');
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return '-';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(numericValue);
};

const getNumericPrice = (product: Product) => {
  const numericValue = Number.parseFloat(
    product.price || product.regular_price || '0'
  );
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const normalizeKey = (key: string) => key.trim().toLowerCase().replace(/\s+/g, '-');

const getAttributeValue = (product: Product, key: string) => {
  const normalized = normalizeKey(key);
  return (
    product.attributes?.find((attr) => {
      const name = attr.name?.toLowerCase();
      const slug = attr.slug?.toLowerCase();
      return (
        name === key.toLowerCase() ||
        slug === normalized ||
        slug === `pa_${normalized}` ||
        slug === normalized.replace(/\s+/g, '') ||
        slug === `pa_${normalized.replace(/\s+/g, '')}`
      );
    })?.options?.[0] || ''
  );
};

const getProductAttributes = (product: Product) => {
  const attrs: Record<string, string> = {};
  product.attributes?.forEach((attr) => {
    if (!attr.name) return;
    const lower = attr.name.toLowerCase();
    if (lower === 'country' || lower === 'pays') return;
    attrs[attr.name] = attr.options?.[0] || '-';
  });
  return attrs;
};

const getStoredMissing = (slug: string) => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${slug}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persistMissing = (slug: string, items: string[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_PREFIX}${slug}`, JSON.stringify(items));
};

const mergeMissingLists = (remote: string[], local: string[]) =>
  Array.from(new Set([...(remote || []), ...(local || [])]));

export default function CountryDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [activeTab, setActiveTab] = useState<Tab>('public');
  const [publicProducts, setPublicProducts] = useState<Product[]>([]);
  const [privateProducts, setPrivateProducts] = useState<Product[]>([]);
  const [missingProducts, setMissingProducts] = useState<string[]>([]);
  const [countryName, setCountryName] = useState('');
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [attributeFilters, setAttributeFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [newProduct, setNewProduct] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const loadAllData = async () => {
      setLoading(true);

      try {
        const [publicData, privateData, missingData] = await Promise.all([
          fetch(`/api/products/by-country-type?country=${slug}&type=public`, {
            cache: 'no-store',
            signal: controller.signal,
          }).then((r) => r.json()),
          fetch(`/api/products/by-country-type?country=${slug}&type=private`, {
            cache: 'no-store',
            signal: controller.signal,
          }).then((r) => r.json()),
          fetch(`/api/missing-products/${slug}`, {
            cache: 'no-store',
            signal: controller.signal,
          }).then((r) => r.json()),
        ]);

        if (!mounted) return;

        setPublicProducts(publicData.products || []);
        setPrivateProducts(privateData.products || []);
        setCountryName(publicData.countryName || slug);

        const remoteMissing = Array.isArray(missingData.missing)
          ? missingData.missing
          : [];
        const storedMissing = getStoredMissing(slug);
        const mergedMissing = mergeMissingLists(remoteMissing, storedMissing);
        setMissingProducts(mergedMissing);
        persistMissing(slug, mergedMissing);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error loading data:', error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAllData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [slug]);

  useEffect(() => {
    setSearchTerm('');
    setCategoryFilter('all');
    setAttributeFilters({});
  }, [activeTab]);

  const currentProducts =
    activeTab === 'public' ? publicProducts : privateProducts;

  const availableCategories = useMemo(() => {
    const categoriesSet = new Set<string>();
    currentProducts.forEach((product) => {
      product.categories?.forEach((cat) => {
        if (cat?.name) categoriesSet.add(cat.name);
      });
    });
    return Array.from(categoriesSet).sort();
  }, [currentProducts]);

  const availableAttributes = useMemo(() => {
    const attributesMap = new Map<string, Set<string>>();

    currentProducts.forEach((product) => {
      product.attributes?.forEach((attr) => {
        if (!attr.name || !attr.options) return;
        const lower = attr.name.toLowerCase();
        if (lower === 'country' || lower === 'pays') return;

        if (!attributesMap.has(attr.name)) {
          attributesMap.set(attr.name, new Set());
        }

        attr.options.forEach((option) => {
          attributesMap.get(attr.name)?.add(option);
        });
      });
    });

    return Array.from(attributesMap.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values).sort(),
    }));
  }, [currentProducts]);

  const filteredProducts = useMemo(() => {
    const filtered = currentProducts.filter((product) => {
      if (
        searchTerm &&
        !product.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      if (categoryFilter !== 'all') {
        const matchesCategory =
          Array.isArray(product.categories) &&
          product.categories.some((cat) => cat?.name === categoryFilter);
        if (!matchesCategory) return false;
      }

      for (const [attrName, filterValue] of Object.entries(attributeFilters)) {
        if (filterValue === 'all') continue;
        const hasMatch = product.attributes?.some(
          (attr) => attr.name === attrName && attr.options?.includes(filterValue)
        );

        if (!hasMatch) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      let compareValue = 0;

      if (sortBy === 'name') {
        compareValue = a.name.localeCompare(b.name);
      } else if (sortBy === 'price') {
        compareValue = getNumericPrice(a) - getNumericPrice(b);
      } else {
        const yearA = parseInt(getAttributeValue(a, 'issue year') || '0', 10) || 0;
        const yearB = parseInt(getAttributeValue(b, 'issue year') || '0', 10) || 0;
        compareValue = yearA - yearB;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [
    currentProducts,
    searchTerm,
    categoryFilter,
    attributeFilters,
    sortBy,
    sortOrder,
  ]);

  const handleAddProduct = () => {
    const trimmed = newProduct.trim();
    if (!trimmed) return;
    const updatedMissing = Array.from(new Set([...missingProducts, trimmed]));
    setMissingProducts(updatedMissing);
    persistMissing(slug, updatedMissing);
    setNewProduct('');
    setIsAdding(false);
  };

  const handleRemoveProduct = (productToRemove: string) => {
    const confirmed = window.confirm(
      `Remove "${productToRemove}" from your missing list?`
    );
    if (!confirmed) {
      return;
    }
    const updatedMissing = missingProducts.filter((p) => p !== productToRemove);
    setMissingProducts(updatedMissing);
    persistMissing(slug, updatedMissing);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className="mt-4 text-gray-600 font-medium">
            Loading {slug} products...
          </p>
          <p className="mt-2 text-sm text-gray-500">
            This should only take a moment.
          </p>
        </div>
      </div>
    );
  }

  const flagUrl = getCountryFlagUrl(countryName || slug, 'h120');
  const attributeFilterSlots = availableAttributes.slice(0, 2);
  const filtersActive =
    searchTerm ||
    categoryFilter !== 'all' ||
    Object.values(attributeFilters).some((value) => value !== 'all');
  const priceSortable = currentProducts.some((product) => getNumericPrice(product) > 0);
  const yearSortable = currentProducts.some((product) =>
    Boolean(getAttributeValue(product, 'issue year'))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            href="/flags"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center gap-2 font-medium"
          >
            <span>←</span> Back to Flags
          </Link>

          <div className="flex items-center gap-4 flex-wrap">
            <Image
              src={flagUrl}
              alt={`${countryName} flag`}
              width={96}
              height={64}
              className="rounded shadow-md object-cover"
              priority
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {capitalizeWords(countryName || slug)}
              </h1>
              <p className="text-gray-600 mt-1">
                {publicProducts.length + privateProducts.length} products tracked
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-6">
            {(['public', 'private', 'missing'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'public' && (
                  <>
                    🌍 Public{' '}
                    <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                      {publicProducts.length}
                    </span>
                  </>
                )}
                {tab === 'private' && (
                  <>
                    🔒 Private{' '}
                    <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                      {privateProducts.length}
                    </span>
                  </>
                )}
                {tab === 'missing' && (
                  <>
                    📋 Missing{' '}
                    <span className="ml-2 bg-red-100 text-red-600 px-2 py-1 rounded-full text-sm">
                      {missingProducts.length}
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {(activeTab === 'public' || activeTab === 'private') && (
          <>
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg border border-blue-100 space-y-4">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4h18M4 8h16M6 12h12M8 16h8M10 20h4"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
                    className="w-full border-2 border-blue-200 rounded-lg px-4 py-3 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm text-gray-900 placeholder-gray-500 font-medium"
                  />
                  <svg
                    className="w-5 h-5 text-blue-500 absolute left-3 top-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full border-2 border-emerald-200 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm text-gray-900 font-medium appearance-none"
                  >
                    <option value="all">📂 All categories</option>
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="w-5 h-5 text-emerald-500 absolute right-3 top-3.5 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {attributeFilterSlots.map((attr) => (
                  <div key={attr.name} className="relative">
                    <select
                      value={attributeFilters[attr.name] || 'all'}
                      onChange={(e) =>
                        setAttributeFilters({
                          ...attributeFilters,
                          [attr.name]: e.target.value,
                        })
                      }
                      className="w-full border-2 border-purple-200 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-sm text-gray-900 font-medium appearance-none"
                    >
                      <option value="all">All {attr.name}</option>
                      {attr.values.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="w-5 h-5 text-purple-500 absolute right-3 top-3.5 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                ))}

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="w-full border-2 border-orange-200 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm text-gray-900 font-medium appearance-none"
                  >
                    <option value="name">Sort by name</option>
                    <option value="price" disabled={!priceSortable}>
                      Sort by price
                    </option>
                    <option value="year" disabled={!yearSortable}>
                      Sort by year
                    </option>
                  </select>
                  <svg
                    className="w-5 h-5 text-orange-500 absolute right-3 top-3.5 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                <button
                  onClick={() =>
                    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                  }
                  className="border-2 border-green-200 bg-white hover:bg-green-50 rounded-lg px-4 py-3 font-semibold text-green-600 shadow-sm transition-all"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">
                    Showing{' '}
                    <span className="text-blue-600">
                      {filteredProducts.length}
                    </span>{' '}
                    of {currentProducts.length} products
                  </span>
                  {filtersActive && (
                    <span className="text-sm text-purple-600 flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5l7 7-7 7-7-7V7z"
                        />
                      </svg>
                      Filters active
                    </span>
                  )}
                </div>
                {filtersActive && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('all');
                      setAttributeFilters({});
                    }}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 w-fit"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="lg:hidden space-y-4">
                {filteredProducts.length === 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500">
                    {currentProducts.length === 0
                      ? 'No products in this collection yet.'
                      : 'No products match your filters.'}
                  </div>
                )}
                {filteredProducts.map((product) => (
                  <ProductMobileCard
                    key={product.id}
                    product={product}
                    activeTab={activeTab}
                    availableAttributes={availableAttributes}
                  />
                ))}
              </div>

              <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Image
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        {availableAttributes.map((attr) => (
                          <th
                            key={attr.name}
                            className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                          >
                            {attr.name}
                          </th>
                        ))}
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {activeTab === 'private' ? 'Source' : 'Price'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td
                            colSpan={availableAttributes.length + 3}
                            className="px-6 py-12 text-center text-gray-500"
                          >
                            {currentProducts.length === 0
                              ? 'No products in this collection.'
                              : 'No products found matching your filters.'}
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((product) => {
                          const attrs = getProductAttributes(product);
                          const source =
                            getAttributeValue(product, 'source') ||
                            getAttributeValue(product, 'Source') ||
                            '-';

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
                                <div className="text-sm font-semibold text-gray-900">
                                  {product.name}
                                </div>
                              </td>
                              {availableAttributes.map((attr) => (
                                <td
                                  key={`${product.id}-${attr.name}`}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                >
                                  {attrs[attr.name] || '-'}
                                </td>
                              ))}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {activeTab === 'private' ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {source}
                                  </span>
                                ) : (
                                  <span className="font-semibold text-gray-900">
                                    {formatPrice(product.price || product.regular_price || '')}
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
          </>
        )}

        {activeTab === 'missing' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Missing / To buy list
              </h2>
              <button
                onClick={() => setIsAdding((prev) => !prev)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <span className="text-xl">+</span>
                Add product
              </button>
            </div>

            {isAdding && (
              <div className="bg-white border-2 border-blue-200 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900">
                  Add new missing product
                </h3>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={newProduct}
                    onChange={(e) => setNewProduct(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddProduct()}
                    placeholder="Ex: 500 lek"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddProduct}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsAdding(false);
                        setNewProduct('');
                      }}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {missingProducts.length === 0 ? (
              <p className="text-gray-500">
                No missing products listed. Add ones you are hunting for!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {missingProducts.map((product) => (
                  <div
                    key={product}
                    className="bg-white border-2 border-red-200 rounded-lg p-4 hover:border-red-400 transition-colors"
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
                      className="w-full mt-2 bg-red-100 hover:bg-red-200 text-red-600 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
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

function ProductMobileCard({
  product,
  activeTab,
  availableAttributes,
}: {
  product: Product;
  activeTab: Tab;
  availableAttributes: Array<{ name: string; values: string[] }>;
}) {
  const attrs = getProductAttributes(product);
  const source =
    getAttributeValue(product, 'source') ||
    getAttributeValue(product, 'Source') ||
    '-';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
      <div className="flex items-center gap-3">
        <img
          src={product.images?.[0]?.src || '/placeholder.png'}
          alt={product.name}
          className="h-16 w-16 object-cover rounded"
        />
        <div>
          <p className="font-semibold text-gray-900">{product.name}</p>
          <p className="text-xs text-gray-500 capitalize">{activeTab} item</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm text-gray-600">
        {availableAttributes.map((attr) => (
          <div key={`${product.id}-${attr.name}`}>
            <dt className="uppercase text-[11px] tracking-wide text-gray-400">
              {attr.name}
            </dt>
            <dd className="font-medium text-gray-800">{attrs[attr.name] || '-'}</dd>
          </div>
        ))}
      </dl>

      <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-sm font-semibold">
        <span className="text-gray-500">
          {activeTab === 'private' ? 'Source' : 'Price'}
        </span>
        <span className="text-gray-900">
          {activeTab === 'private'
            ? source
            : formatPrice(product.price || product.regular_price || '')}
        </span>
      </div>
    </div>
  );
}
