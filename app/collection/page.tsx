// app/collection/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Product } from "@/lib/types";
import EditProductModal from "@/app/components/EditProductModal";
import AddProductModal from "@/app/components/AddProductModal";
import "./collection.css"; // ← We'll create this next

export default function MyCollectionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedQuality, setSelectedQuality] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // Filter options
  const [countries, setCountries] = useState<string[]>([]);
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
  }, [searchTerm, selectedCountry, selectedQuality, selectedYear, products]);

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

  const extractFilterOptions = (productList: Product[]) => {
    const countriesSet = new Set<string>();
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
    });

    setCountries(Array.from(countriesSet).sort());
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

        {/* Filters */}
        <div className="wpc-filters-widget-wrapper mb-6">
          <div className="wpc-filters-section">
            <input
              type="text"
              placeholder="🔍 Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="wpc-filters-section">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="filter-select"
            >
              <option value="">🌍 All Countries</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div className="wpc-filters-section">
            <select
              value={selectedQuality}
              onChange={(e) => setSelectedQuality(e.target.value)}
              className="filter-select"
            >
              <option value="">⭐ All Qualities</option>
              {qualities.map((quality) => (
                <option key={quality} value={quality}>
                  {quality}
                </option>
              ))}
            </select>
          </div>

          <div className="wpc-filters-section">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="filter-select"
            >
              <option value="">📅 All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="wpc-filters-section">
            <button onClick={clearFilters} className="clear-button">
              Clear
            </button>
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
              {searchTerm || selectedCountry || selectedQuality || selectedYear
                ? "No products match your filters"
                : "No private products found in your collection"}
            </p>
            {(searchTerm ||
              selectedCountry ||
              selectedQuality ||
              selectedYear) && (
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
    // Reload all products to ensure images are shown
    loadProducts();
    setIsAddModalOpen(false);
  }}
/>

    </div>
  );
}
