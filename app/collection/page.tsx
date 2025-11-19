// app/collection/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Product } from "@/lib/types";
import EditProductModal from "@/app/components/EditProductModal";
import AddProductModal from "@/app/components/AddProductModal";
import "./collection.css";

export default function MyCollectionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(""); // NEW
  const [selectedQuality, setSelectedQuality] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // Filter options
  const [countries, setCountries] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]); // NEW
  const [qualities, setQualities] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);

  // Edit modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Add modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedCountry, selectedCategory, selectedQuality, selectedYear, products]); // Updated

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products/private");
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setProducts(data);
        extractFilterOptions(data);
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // app/collection/page.tsx - Fix the extractFilterOptions and applyFilters functions

const extractFilterOptions = (productList: Product[]) => {
  const countriesSet = new Set<string>();
  const categoriesSet = new Set<string>();
  const qualitiesSet = new Set<string>();
  const yearsSet = new Set<string>();

  productList.forEach((product) => {
    const countryAttr = product.attributes.find(
      (a) => a.slug === "pa_country"
    );
    const qualityAttr = product.attributes.find(
      (a) => a.slug === "pa_quality"
    );
    const yearAttr = product.attributes.find(
      (a) => a.slug === "pa_issue-year"
    );

    if (countryAttr?.options[0]) countriesSet.add(countryAttr.options[0]);
    if (qualityAttr?.options[0]) qualitiesSet.add(qualityAttr.options[0]);
    if (yearAttr?.options[0]) yearsSet.add(yearAttr.options[0]);

    // Extract categories - Fixed with proper type checking
    if (Array.isArray(product.categories) && product.categories.length > 0) {
      product.categories.forEach((cat: any) => {
        if (cat && cat.name) {
          categoriesSet.add(cat.name);
        }
      });
    }
  });

  setCountries(Array.from(countriesSet).sort());
  setCategories(Array.from(categoriesSet).sort());
  setQualities(Array.from(qualitiesSet).sort());
  setYears(Array.from(yearsSet).sort((a, b) => b.localeCompare(a)));
};

const applyFilters = () => {
  let filtered = [...products];

  if (searchTerm) {
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (selectedCountry) {
    filtered = filtered.filter((p) => {
      const attr = p.attributes.find((a) => a.slug === "pa_country");
      return attr?.options[0] === selectedCountry;
    });
  }

  // Category filter - Fixed with proper type checking
  if (selectedCategory) {
    filtered = filtered.filter((p) => {
      if (!Array.isArray(p.categories)) return false;
      return p.categories.some((cat: any) => cat && cat.name === selectedCategory);
    });
  }

  if (selectedQuality) {
    filtered = filtered.filter((p) => {
      const attr = p.attributes.find((a) => a.slug === "pa_quality");
      return attr?.options[0] === selectedQuality;
    });
  }

  if (selectedYear) {
    filtered = filtered.filter((p) => {
      const attr = p.attributes.find((a) => a.slug === "pa_issue-year");
      return attr?.options[0] === selectedYear;
    });
  }

  setFilteredProducts(filtered);
};

  const getAttributeValue = (product: Product, slug: string): string => {
    const attr = product.attributes.find((a) => a.slug === slug);
    return attr?.options[0] || "-";
  };

  const getProductImages = (product: Product): { primary: string; secondary: string } => {
    console.log(`Product ${product.id} images:`, product.images);
    
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const primary = product.images[0]?.src || 'https://via.placeholder.com/300x300?text=No+Image';
      const secondary = product.images[1]?.src || product.images[0]?.src || 'https://via.placeholder.com/300x300?text=No+Image';
      
      console.log(`Using images - Primary: ${primary}, Secondary: ${secondary}`);
      
      return { primary, secondary };
    }
    
    console.log('No images found, using placeholder');
    return {
      primary: 'https://via.placeholder.com/300x300?text=No+Image',
      secondary: 'https://via.placeholder.com/300x300?text=No+Image'
    };
  };

  const handleDelete = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`/api/products/delete?id=${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProducts(products.filter((p) => p.id !== productId));
        alert("✅ Product deleted successfully!");
      } else {
        alert("❌ Failed to delete product");
      }
    } catch (error) {
      alert("❌ Error deleting product");
      console.error(error);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCountry("");
    setSelectedCategory(""); // NEW
    setSelectedQuality("");
    setSelectedYear("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold">❌ Error</p>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="collection-page">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📦 My Collection
          </h1>
          <p className="text-gray-600">
            {filteredProducts.length} of {products.length} private items
          </p>
        </div>

        {/* Filters - Updated with Category */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg mb-6 border border-blue-100">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-2 border-blue-200 rounded-lg px-4 py-3 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-gray-900 placeholder-gray-500 font-medium hover:border-blue-300 transition-colors"
              />
              <svg className="w-5 h-5 text-blue-500 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Country Filter */}
            <div className="relative">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full border-2 border-green-200 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm text-gray-900 font-medium appearance-none cursor-pointer hover:border-green-300 transition-colors"
              >
                <option value="" className="text-gray-900 font-semibold">🌍 All Countries</option>
                {countries.map((country) => (
                  <option key={country} value={country} className="text-gray-800 font-medium">
                    {country}
                  </option>
                ))}
              </select>
              <svg className="w-5 h-5 text-green-500 absolute right-3 top-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* NEW: Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border-2 border-pink-200 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white shadow-sm text-gray-900 font-medium appearance-none cursor-pointer hover:border-pink-300 transition-colors"
              >
                <option value="" className="text-gray-900 font-semibold">📂 All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category} className="text-gray-800 font-medium">
                    {category}
                  </option>
                ))}
              </select>
              <svg className="w-5 h-5 text-pink-500 absolute right-3 top-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Quality Filter */}
            <div className="relative">
              <select
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value)}
                className="w-full border-2 border-purple-200 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm text-gray-900 font-medium appearance-none cursor-pointer hover:border-purple-300 transition-colors"
              >
                <option value="" className="text-gray-900 font-semibold">⭐ All Qualities</option>
                {qualities.map((quality) => (
                  <option key={quality} value={quality} className="text-gray-800 font-medium">
                    {quality}
                  </option>
                ))}
              </select>
              <svg className="w-5 h-5 text-purple-500 absolute right-3 top-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Year Filter */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full border-2 border-orange-200 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-sm text-gray-900 font-medium appearance-none cursor-pointer hover:border-orange-300 transition-colors"
              >
                <option value="" className="text-gray-900 font-semibold">📅 All Years</option>
                {years.map((year) => (
                  <option key={year} value={year} className="text-gray-800 font-medium">
                    {year}
                  </option>
                ))}
              </select>
              <svg className="w-5 h-5 text-orange-500 absolute right-3 top-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Clear Button */}
            <button 
              onClick={clearFilters} 
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear All
            </button>
          </div>

          {/* Results Count */}
          <div className="mt-4 bg-white/70 backdrop-blur-sm rounded-lg px-4 py-3 border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700">
                <span className="text-blue-600 text-lg">{filteredProducts.length}</span>
                <span className="text-gray-500"> products found</span>
              </div>
              {(searchTerm || selectedCountry || selectedCategory || selectedQuality || selectedYear) && (
                <div className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Filters active
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products Grid - WooCommerce Style */}
        {filteredProducts.length > 0 ? (
          <ul className="products columns-4">
            {filteredProducts.map((product) => {
              const images = getProductImages(product);
              return (
                <li key={product.id} className="product">
                  <div className="product-inner">
                    {/* Image Container with Flip Effect */}
                    <div className="product-image-wrapper">
                      <img
                        src={images.primary}
                        alt={product.name}
                        className="primary-image"
                      />
                      <img
                        src={images.secondary}
                        alt={`${product.name} - Back`}
                        className="secondary-image"
                      />
                    </div>

                    {/* Product Title */}
                    <h2 className="woocommerce-loop-product__title">
                      {product.name}
                    </h2>

                    {/* Action Buttons - Only Edit and Delete */}
                    <div className="product-actions">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setIsModalOpen(true);
                        }}
                        className="action-button edit-button"
                        title="Edit Product"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="action-button delete-button"
                        title="Delete Product"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p className="empty-text">
              {searchTerm || selectedCountry || selectedCategory || selectedQuality || selectedYear
                ? "No products match your filters"
                : "No private products found in your collection"}
            </p>
            {(searchTerm || selectedCountry || selectedCategory || selectedQuality || selectedYear) && (
              <button onClick={clearFilters} className="empty-button">
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Edit Modal */}
        <EditProductModal
          product={editingProduct}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={(updatedProduct) => {
            setProducts(
              products.map((p) =>
                p.id === updatedProduct.id ? updatedProduct : p
              )
            );
          }}
        />
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="floating-add-button"
        title="Add New Product"
      >
        ➕
      </button>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={(newProduct) => {
          loadProducts();
          setIsAddModalOpen(false);
        }}
      />
    </div>
  );
}
