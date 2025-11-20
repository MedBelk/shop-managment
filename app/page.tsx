"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type StatColor = "amber" | "green" | "blue" | "purple" | "orange";

const CARD_THEMES: Record<
  StatColor,
  { border: string; accent: string; iconWrapper: string }
> = {
  amber: {
    border: "border-amber-500",
    accent: "text-amber-600",
    iconWrapper: "bg-amber-50 text-amber-500",
  },
  green: {
    border: "border-emerald-500",
    accent: "text-emerald-600",
    iconWrapper: "bg-emerald-50 text-emerald-500",
  },
  blue: {
    border: "border-sky-500",
    accent: "text-sky-600",
    iconWrapper: "bg-sky-50 text-sky-500",
  },
  purple: {
    border: "border-purple-500",
    accent: "text-purple-600",
    iconWrapper: "bg-purple-50 text-purple-500",
  },
  orange: {
    border: "border-orange-500",
    accent: "text-orange-600",
    iconWrapper: "bg-orange-50 text-orange-500",
  },
};

type DashboardStats = {
  coins: number;
  banknotes: number;
  publicProducts: number;
  privateProducts: number;
  countries: number;
};

const INITIAL_STATS: DashboardStats = {
  coins: 0,
  banknotes: 0,
  publicProducts: 0,
  privateProducts: 0,
  countries: 0,
};

function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!Number.isFinite(end) || end <= 0) {
      setCount(end);
      return;
    }

    let animationFrame: number;
    let startTime: number | null = null;

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(easeOutQuart * end);

      setCount(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return count;
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: number;
  label: string;
  color: StatColor;
}) {
  const animatedValue = useCountUp(value);
  const theme = CARD_THEMES[color];

  return (
    <div
      className={`bg-white rounded-xl shadow-lg p-6 border-t-4 ${theme.border} transition-transform duration-300 hover:-translate-y-1`}
    >
      <div className="flex flex-col items-center text-center gap-2">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${theme.iconWrapper}`}
        >
          {icon}
        </div>
        <div className={`text-3xl font-bold tabular-nums ${theme.accent}`}>
          {animatedValue.toLocaleString()}
        </div>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const loadStats = async () => {
      try {
        setError("");
        const [publicRes, privateRes, countriesRes, categoriesRes] =
          await Promise.all([
            fetch("/api/products/by-type?type=public&count=true", {
              cache: "no-store",
              signal,
            }).catch(() => null),
            fetch("/api/products/by-type?type=private&count=true", {
              cache: "no-store",
              signal,
            }).catch(() => null),
            fetch("/api/attributes/countries", {
              cache: "no-store",
              signal,
            }).catch(() => null),
            fetch("/api/products/by-type?categories=true", {
              cache: "no-store",
              signal,
            }).catch(() => null),
          ]);

        const [publicCount, privateCount, countriesCount, categoryCounts] =
          await Promise.all([
            publicRes?.ok ? publicRes.json() : { count: 0 },
            privateRes?.ok ? privateRes.json() : { count: 0 },
            countriesRes?.ok ? countriesRes.json() : [],
            categoriesRes?.ok ? categoriesRes.json() : { coins: 0, banknotes: 0 },
          ]);

        setStats({
          coins: categoryCounts.coins ?? 0,
          banknotes: categoryCounts.banknotes ?? 0,
          publicProducts: publicCount.count ?? 0,
          privateProducts: privateCount.count ?? 0,
          countries: Array.isArray(countriesCount) ? countriesCount.length : 0,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error loading stats:", err);
          setError("Unable to load the latest stats right now.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
        <header className="text-center mb-14">
         
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Coins & Banknotes command center
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Monitor public stats, maintain your private vault, and spot missing
            notes across every country – perfectly responsive on any screen.
          </p>
        </header>

        <section className="mb-14">
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            <StatCard icon="🪙" value={stats.coins} label="Coins" color="amber" />
            <StatCard
              icon="💵"
              value={stats.banknotes}
              label="Banknotes"
              color="green"
            />
            <StatCard
              icon="🌍"
              value={stats.publicProducts}
              label="Public Items"
              color="blue"
            />
            <StatCard
              icon="🔒"
              value={stats.privateProducts}
              label="Private Items"
              color="purple"
            />
            <StatCard
              icon="🗺️"
              value={stats.countries}
              label="Countries"
              color="orange"
            />
          </div>
          {loading && (
            <p className="mt-3 text-sm text-slate-500 text-center">
              Fetching fresh data…
            </p>
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Link
            href="/flags"
            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                  🌍
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                    Browse by country
                  </h2>
                  <p className="text-slate-600">
                    Filter by denomination, year, and quality with instant search.
                  </p>
                </div>
              </div>
              <p className="text-slate-600 mb-5">
                Explore every flag, check inventory gaps, and jump into country-level
                insights optimized for phones, tablets, and desktops.
              </p>
              <div className="flex items-center text-sky-600 font-semibold group-hover:gap-3 transition-all">
                <span>Explore countries</span>
                <svg
                  className="w-5 h-5 group-hover:translate-x-2 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </div>
          </Link>

          <Link
            href="/collection"
            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                  📦
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                    Manage my vault
                  </h2>
                  <p className="text-slate-600">Add, edit, delete in one tap.</p>
                </div>
              </div>
              <p className="text-slate-600 mb-5">
                Built-in modals and image uploads keep your private inventory synced
                with WooCommerce while remaining blazing fast locally.
              </p>
              <div className="flex items-center text-purple-600 font-semibold group-hover:gap-3 transition-all">
                <span>Open collection</span>
                <svg
                  className="w-5 h-5 group-hover:translate-x-2 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </div>
          </Link>
        </section>

        
      </div>
    </div>
  );
}
