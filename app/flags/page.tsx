// app/flags/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Country } from '@/lib/types';
import { getCountryFlagUrl } from '@/lib/flags';

export default function FlagsPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Single useEffect - no duplicates!
  useEffect(() => {
    fetch('/api/attributes/countries')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          // Log country names to see exact format
          console.log('📊 Countries from API:', data.map((c: Country) => c.name));
          setCountries(data);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading countries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold">❌ Error</p>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🗺️ Flags & Inventory
          </h1>
          <p className="text-gray-600">
            Click on a country to view its inventory ({countries.length} countries)
          </p>
        </div>

        {/* Countries Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {countries.map(country => {
            const flagUrl = getCountryFlagUrl(country.name, 'h80');
            console.log(`🏁 ${country.name} -> ${flagUrl}`);
            
            return (
              <Link
                key={country.id}
                href={`/flags/${country.slug}`}
                className="group"
              >
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6 text-center transition-all duration-300 hover:border-blue-500 hover:shadow-lg hover:-translate-y-1">
                  {/* Real Country Flag Image */}
                  <div className="mb-4 flex items-center justify-center h-16">
                    <img
                      src={flagUrl}
                      alt={`${country.name} flag`}
                      className="max-w-full max-h-full rounded shadow-md"
                      onError={(e) => {
                        console.error(`❌ Flag failed for: ${country.name} (${flagUrl})`);
                        // Fallback to emoji if image fails to load
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="text-6xl">🏳️</div>';
                        }
                      }}
                      onLoad={() => {
                        console.log(`✅ Flag loaded: ${country.name}`);
                      }}
                    />
                  </div>
                  
                  {/* Country Name */}
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                    {country.name}
                  </h3>
                  
                  {/* Product Count */}
                  <p className="text-sm text-gray-500">
                    {country.count} {country.count === 1 ? 'product' : 'products'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {countries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No countries found</p>
          </div>
        )}
      </div>
    </div>
  );
}
