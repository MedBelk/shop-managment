// app/page.tsx
'use client';

// ❌ Remove these lines - they're for server components only
// export const dynamic = 'force-dynamic';
// export const revalidate = 0;

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Counter Animation Hook
function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (end === 0) return;

    let startTime: number | null = null;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(easeOutQuart * end);

      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
}

// Animated Stat Card Component
function StatCard({ 
  icon, 
  value, 
  label, 
  color 
}: { 
  icon: string; 
  value: number; 
  label: string; 
  color: string;
}) {
  const animatedValue = useCountUp(value, 2000);

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-t-4 border-${color}-500 transform hover:scale-105 transition-transform duration-300`}>
      <div className="text-center">
        <div className="text-4xl mb-2">{icon}</div>
        <div className="text-3xl font-bold text-gray-900 tabular-nums">
          {animatedValue.toLocaleString()}
        </div>
        <div className="text-gray-600 font-medium mt-1">{label}</div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState({
    coins: 0,
    banknotes: 0,
    publicProducts: 0,
    privateProducts: 0,
    countries: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Add cache: 'no-store' to prevent caching
        const [publicRes, privateRes, countriesRes, categoriesRes] = await Promise.all([
          fetch('/api/products/by-type?type=public&count=true', { cache: 'no-store' }).catch(() => null),
          fetch('/api/products/by-type?type=private&count=true', { cache: 'no-store' }).catch(() => null),
          fetch('/api/attributes/countries', { cache: 'no-store' }).catch(() => null),
          fetch('/api/products/by-type?categories=true', { cache: 'no-store' }).catch(() => null)
        ]);

        let publicProducts = 0;
        let privateProducts = 0;
        let countries = 0;
        let coins = 0;
        let banknotes = 0;

        if (publicRes && publicRes.ok) {
          const data = await publicRes.json();
          publicProducts = data.count || 0;
        }

        if (privateRes && privateRes.ok) {
          const data = await privateRes.json();
          privateProducts = data.count || 0;
        }

        if (countriesRes && countriesRes.ok) {
          const countriesData = await countriesRes.json();
          countries = Array.isArray(countriesData) ? countriesData.length : 0;
        }

        if (categoriesRes && categoriesRes.ok) {
          const categoryData = await categoriesRes.json();
          coins = categoryData.coins || 0;
          banknotes = categoryData.banknotes || 0;
        }

        setStats({
          coins,
          banknotes,
          publicProducts,
          privateProducts,
          countries
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };
    
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Coins and Banknotes
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            The Central of Currency - Personal Collection Manager
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-16">
          <StatCard
            icon="🪙"
            value={stats.coins}
            label="Coins"
            color="amber"
          />
          <StatCard
            icon="💵"
            value={stats.banknotes}
            label="Banknotes"
            color="green"
          />
          <StatCard
            icon="🌍"
            value={stats.publicProducts}
            label="Public"
            color="blue"
          />
          <StatCard
            icon="🔒"
            value={stats.privateProducts}
            label="Private"
            color="purple"
          />
          <StatCard
            icon="🗺️"
            value={stats.countries}
            label="Countries"
            color="orange"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link
            href="/flags"
            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-4xl">🌍</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    Browse by Country
                  </h3>
                  <p className="text-gray-600">Explore collection by flags</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                View coins and banknotes organized by country. Filter by denomination, year, condition and more.
              </p>
              <div className="flex items-center text-blue-600 font-semibold group-hover:gap-3 transition-all">
                <span>Explore Countries</span>
                <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>

          <Link
            href="/collection"
            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-4xl">📦</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                    My Collection
                  </h3>
                  <p className="text-gray-600">Private inventory</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Manage your private collection. Add, edit, delete items and track your sources and purchases.
              </p>
              <div className="flex items-center text-purple-600 font-semibold group-hover:gap-3 transition-all">
                <span>View Collection</span>
                <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
