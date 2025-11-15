// app/components/EditProductModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';

interface EditProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProduct: Product) => void;
}

interface AttributeTerm {
  id: number;
  name: string;
  slug: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function EditProductModal({ product, isOpen, onClose, onSave }: EditProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    country: '',
    quality: '',
    year: ''
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<AttributeTerm[]>([]);
  const [qualities, setQualities] = useState<AttributeTerm[]>([]);
  const [years, setYears] = useState<AttributeTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Set form data when product changes
  useEffect(() => {
    if (product) {
      const getAttr = (slug: string) => {
        const attr = product.attributes.find(a => a.slug === slug);
        return attr?.options[0] || '';
      };

      setFormData({
        name: product.name,
        price: product.price,
        category: '',
        country: getAttr('pa_country'),
        quality: getAttr('pa_quality'),
        year: getAttr('pa_issue-year')
      });
    }
  }, [product]);

  // Load attribute options when modal opens
  useEffect(() => {
    if (isOpen) {
      loadOptions();
    }
  }, [isOpen]);

 const loadOptions = async () => {
  try {
    setLoading(true);
    setLoadError('');

    // Fetch categories
    try {
      const catResponse = await fetch('/api/categories');
      if (catResponse.ok) {
        const catData = await catResponse.json();
        setCategories(Array.isArray(catData) ? catData : []);
      }
    } catch (e) {
      console.error('Failed to load categories:', e);
    }

    // Fetch countries (attribute ID 6)
    try {
      const countryResponse = await fetch('/api/attributes/countries');
      if (countryResponse.ok) {
        const countryData = await countryResponse.json();
        setCountries(Array.isArray(countryData) ? countryData : []);
      }
    } catch (e) {
      console.error('Failed to load countries:', e);
    }

    // Fetch qualities (attribute ID 8)
    try {
      const qualityResponse = await fetch('/api/attributes/quality');
      if (qualityResponse.ok) {
        const qualityData = await qualityResponse.json();
        setQualities(Array.isArray(qualityData) ? qualityData : []);
      }
    } catch (e) {
      console.error('Failed to load qualities:', e);
    }

    // Fetch years (attribute ID 7)
    try {
      const yearResponse = await fetch('/api/attributes/years');
      if (yearResponse.ok) {
        const yearData = await yearResponse.json();
        setYears(Array.isArray(yearData) ? yearData : []);
      }
    } catch (e) {
      console.error('Failed to load years:', e);
    }

    setLoading(false);
  } catch (error) {
    console.error('Error loading options:', error);
    setLoadError('Failed to load dropdown options. You can still edit manually.');
    setLoading(false);
  }
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setSaving(true);

    try {
      const response = await fetch('/api/products/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          ...formData
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Product updated successfully!');
        onSave(data.product);
        onClose();
      } else {
        alert('❌ Error: ' + (data.error || 'Failed to update product'));
      }
    } catch (error) {
      alert('❌ Error updating product');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
        </div>

        {/* Form */}
        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Loading options...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {loadError && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                ⚠️ {loadError}
              </div>
            )}

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Dropdown or Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              {categories.length > 0 ? (
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Enter category"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>

            {/* Country Dropdown or Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              {countries.length > 0 ? (
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Country</option>
                  {countries.map(country => (
                    <option key={country.id} value={country.name}>{country.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Enter country"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>

            {/* Quality Dropdown or Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality
              </label>
              {qualities.length > 0 ? (
                <select
                  value={formData.quality}
                  onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Quality</option>
                  {qualities.map(quality => (
                    <option key={quality.id} value={quality.name}>{quality.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.quality}
                  onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                  placeholder="Enter quality"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>

            {/* Year Dropdown or Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Year
              </label>
              {years.length > 0 ? (
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Year</option>
                  {years.map(year => (
                    <option key={year.id} value={year.name}>{year.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="Enter year"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-gray-200 -mx-6 -mb-6 px-6 py-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed font-medium transition-colors"
              >
                ❌ Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
