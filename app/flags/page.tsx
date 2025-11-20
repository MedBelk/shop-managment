'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Country } from '@/lib/types';
import { getCountryFlagUrl } from '@/lib/flags';

type SortDirection = 'asc' | 'desc';

export default function FlagsPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [flagErrors, setFlagErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const controller = new AbortController();

    const fetchCountries = async () => {
      try {
        const response = await fetch('/api/attributes/countries', {
          cache: 'no-store',
          signal: controller.signal,
        });
        const data = await response.json();

        if (data.error) {
          setError(data.error);
        } else {
          setCountries(data);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError((err as Error).message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();

    return () => controller.abort();
  }, []);

  const filteredCountries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = term
      ? countries.filter((country) =>
          country.name.toLowerCase().includes(term)
        )
      : countries;

    return [...filtered].sort((a, b) => {
      const compare = a.name.localeCompare(b.name);
      return sortDirection === 'asc' ? compare : -compare;
    });
  }, [countries, searchTerm, sortDirection]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          {/* Modern globe animation */}
          <div className="relative inline-block">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 animate-spin">
              <div className="w-24 h-24 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-400"></div>
            </div>
            {/* Middle rotating ring - opposite direction */}
            <div className="absolute inset-2 animate-spin-reverse">
              <div className="w-20 h-20 rounded-full border-4 border-transparent border-b-purple-500 border-l-purple-400"></div>
            </div>
            {/* Center globe icon */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <span className="text-5xl animate-pulse">🌍</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-red-600 max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-xl font-semibold mb-2">Unable to Load Countries</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              🗺️ Flags & Inventory
            </h1>
            <p className="text-gray-600">
              Tap a country to inspect its collection ({countries.length} total)
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:border-gray-300 transition-colors"
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
                d="M8 7h8M6 12h12M10 17h4"
              />
            </svg>
            Sort {sortDirection === 'asc' ? 'A → Z' : 'Z → A'}
          </button>
        </div>

        <div className="mb-8 space-y-3">
          <div className="relative max-w-xl">
            <input
              type="text"
              placeholder="Search countries..."
              aria-label="Search countries"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-gray-900 font-medium"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-4 top-4"
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
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
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
              </button>
            )}
          </div>

          <p className="text-sm text-gray-600">
            Showing{' '}
            <span className="font-semibold text-blue-600">
              {filteredCountries.length}
            </span>{' '}
            {filteredCountries.length === 1 ? 'country' : 'countries'}
            {searchTerm && (
              <>
                {' '}
                matching &quot;<span className="font-semibold">{searchTerm}</span>&quot;
              </>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredCountries.map((country) => {
            const flagUrl = getCountryFlagUrl(country.name, 'h80');
            const hasFlagError = flagErrors[country.id];

            return (
              <Link
                key={country.id}
                href={`/flags/${country.slug}`}
                aria-label={`Open ${country.name}`}
                className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded-xl"
              >
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6 text-center transition-all duration-300 hover:border-blue-500 hover:shadow-lg hover:-translate-y-1">
                  <div className="mb-4 flex items-center justify-center h-16">
                    {hasFlagError ? (
                      <div className="text-4xl" aria-hidden>
                        🏳️
                      </div>
                    ) : (
                      <Image
                        src={flagUrl}
                        alt={`${country.name} flag`}
                        width={96}
                        height={64}
                        className="rounded shadow-md object-cover"
                        onError={() =>
                          setFlagErrors((prev) => ({
                            ...prev,
                            [country.id]: true,
                          }))
                        }
                      />
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600">
                    {searchTerm ? (
                      <HighlightText text={country.name} highlight={searchTerm} />
                    ) : (
                      country.name
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {country.count}{' '}
                    {country.count === 1 ? 'product' : 'products'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredCountries.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg">
              No countries match your search. Try a different keyword.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function HighlightText({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) {
  if (!highlight.trim()) return <>{text}</>;

  const safeHighlight = escapeRegExp(highlight.trim());
  const regex = new RegExp(`(${safeHighlight})`, 'gi');
  const parts = text.split(regex);
  const lowerHighlight = highlight.trim().toLowerCase();

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === lowerHighlight ? (
          <span key={`${part}-${index}`} className="bg-yellow-200 text-gray-900 px-1 rounded">
            {part}
          </span>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      )}
    </>
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
