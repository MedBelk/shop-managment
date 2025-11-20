// app/components/AddProductModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: Product) => void;
}

export default function AddProductModal({ isOpen, onClose, onAdd }: AddProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    quality: '',
    year: ''
  });
  
  // Image states
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>('');
  const [backPreview, setBackPreview] = useState<string>('');
  
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  
  // Dropdown options
  const [countries, setCountries] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadOptions();
    }
  }, [isOpen]);

  const loadOptions = async () => {
    setLoadingOptions(true);
    try {
      const countriesRes = await fetch('/api/attributes/countries');
      const countriesData = await countriesRes.json();
      if (Array.isArray(countriesData)) {
        const countryNames = countriesData
          .map((c: { name?: string }) => c?.name)
          .filter((name): name is string => Boolean(name))
          .sort((a, b) => a.localeCompare(b));
        setCountries(countryNames);
      }

      const yearsRes = await fetch('/api/attributes/years');
      const yearsData = await yearsRes.json();
      if (Array.isArray(yearsData)) {
        const yearNames = yearsData
          .map((y: { name?: string }) => y?.name)
          .filter((name): name is string => Boolean(name))
          .sort((a, b) => b.localeCompare(a));
        setYears(yearNames);
      }
    } catch (error) {
      console.error('Error loading options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleFrontImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontImage(file);
      setFrontPreview(URL.createObjectURL(file));
      console.log('📷 Front image selected:', file.name);
    }
  };

  const handleBackImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackImage(file);
      setBackPreview(URL.createObjectURL(file));
      console.log('📷 Back image selected:', file.name);
    }
  };

  const uploadImage = async (file: File): Promise<number | null> => {
    console.log('📤 Uploading image:', file.name, file.size, 'bytes');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      console.log('Upload response:', data);
      
      if (data.success && data.id) {
        console.log('✅ Image uploaded with ID:', data.id);
        return data.id;
      } else {
        console.error('❌ Upload failed:', data.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      return null;
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const imageIds: number[] = [];
      
      // Upload front image
      if (frontImage) {
        setUploadProgress('Uploading front image...');
        console.log('🚀 Starting front image upload...');
        const frontId = await uploadImage(frontImage);
        if (frontId) {
          imageIds.push(frontId);
          console.log('✅ Front image uploaded:', frontId);
        } else {
          console.error('❌ Front image upload failed');
        }
      } else {
        console.log('⚠️ No front image selected');
      }

      // Upload back image
      if (backImage) {
        setUploadProgress('Uploading back image...');
        console.log('🚀 Starting back image upload...');
        const backId = await uploadImage(backImage);
        if (backId) {
          imageIds.push(backId);
          console.log('✅ Back image uploaded:', backId);
        } else {
          console.error('❌ Back image upload failed');
        }
      } else {
        console.log('⚠️ No back image selected');
      }

      console.log('📷 Total uploaded image IDs:', imageIds);
      setUploadProgress('Creating product...');

      // Create product with images
      const productData = {
        ...formData,
        status: 'private',
        imageIds: imageIds
      };

      console.log('📦 Creating product with data:', productData);

      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('✅ Product added successfully!');
        onAdd(data.product);
        onClose();
        // Reset form
        setFormData({ name: '', country: '', quality: '', year: '' });
        setFrontImage(null);
        setBackImage(null);
        setFrontPreview('');
        setBackPreview('');
      } else {
        alert('❌ Error: ' + (data.error || 'Failed to add product'));
      }
    } catch (error) {
      console.error('❌ Submit error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert('❌ Network error: ' + message);
    } finally {
      setSaving(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content add-product-modal bg-gradient-to-b from-white to-slate-50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 text-white">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-80">Quick add</p>
            <h2 className="modal-title text-white">➕ Add New Product</h2>
          </div>
          <button onClick={onClose} className="modal-close text-white/80 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form space-y-6">
          <section className="grid gap-4 md:grid-cols-2">
            <div className="form-group">
              <label className="flex items-center justify-between">
                <span>Product Name *</span>
                <span className="text-xs font-semibold text-sky-600">Required</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ex: 20 Dirhams 2015"
                className="shadow-inner"
              />
            </div>

            <div className="form-group">
              <label>Country</label>
              {loadingOptions ? (
                <div className="animate-pulse rounded-lg bg-slate-200 h-11" />
              ) : (
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                >
                  <option value="">Select country</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              )}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="form-group">
              <label>Quality</label>
              <select
                value={formData.quality}
                onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
              >
                <option value="">Select quality</option>
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Used">Used</option>
              </select>
            </div>

            <div className="form-group">
              <label>Issue Year</label>
              {loadingOptions ? (
                <div className="animate-pulse rounded-lg bg-slate-200 h-11" />
              ) : (
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                >
                  <option value="">Select year</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-600 mb-3">
              Upload images <span className="text-xs font-normal text-slate-400">(front & back)</span>
            </p>
            <div className="image-upload-section">
              <div className="form-group">
                <label>Front Image (Main)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFrontImageChange}
                  className="file-input"
                />
                {frontPreview && (
                  <div className="image-preview">
                    <img src={frontPreview} alt="Front preview" />
                    <p className="text-xs text-gray-600 mt-1">{frontImage?.name}</p>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Back Image (Gallery)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackImageChange}
                  className="file-input"
                />
                {backPreview && (
                  <div className="image-preview">
                    <img src={backPreview} alt="Back preview" />
                    <p className="text-xs text-gray-600 mt-1">{backImage?.name}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {uploadProgress && (
            <div className="upload-progress">
              {uploadProgress}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="submit"
              disabled={saving || loadingOptions}
              className="btn-save"
            >
              {saving ? uploadProgress || 'Adding...' : '✅ Add Product'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
              disabled={saving}
            >
              ✕ Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
