// app/flags/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Country } from '@/lib/types';
import { getCountryFlagUrl } from '@/lib/flags';

export default function FlagsPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/attributes/countries')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
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

  // Filter countries based on search term
  const filteredCountries = useMemo(() => {
    if (!searchTerm.trim()) return countries;
    
    const search = searchTerm.toLowerCase();
    return countries.filter(country => 
      country.name.toLowerCase().includes(search)
    );
  }, [countries, searchTerm]);

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

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-gray-900 font-medium"
            />
            <svg 
              className="w-5 h-5 text-gray-400 absolute left-4 top-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Results count */}
          {searchTerm && (
            <p className="mt-3 text-sm text-gray-600">
              {filteredCountries.length === 0 ? (
                <span className="text-red-600">No countries found matching "{searchTerm}"</span>
              ) : (
                <span>
                  Found <span className="font-semibold text-blue-600">{filteredCountries.length}</span> 
                  {filteredCountries.length === 1 ? ' country' : ' countries'}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Countries Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredCountries.map(country => {
            const flagUrl = getCountryFlagUrl(country.name, 'h80');
            
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
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="text-6xl">🏳️</div>';
                        }
                      }}
                    />
                  </div>
                  
                  {/* Country Name - Highlight matching text */}
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                    {searchTerm ? (
                      <HighlightText text={country.name} highlight={searchTerm} />
                    ) : (
                      country.name
                    )}
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
        {filteredCountries.length === 0 && !searchTerm && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No countries found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component to highlight matching text
function HighlightText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) {
    return <>{text}</>;
  }

  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="bg-yellow-200 text-gray-900">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
