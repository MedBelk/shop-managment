// app/components/Navigation.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

type NavLink = {
  href: string;
  label: string;
  icon: ReactNode;
};

const NAV_LINKS: NavLink[] = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg
        className="w-5 h-5 mr-2 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11 2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    href: "/flags",
    label: "Countries",
    icon: (
      <svg
        className="w-5 h-5 mr-2 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    href: "/collection",
    label: "My Collection",
    icon: (
      <svg
        className="w-5 h-5 mr-2 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
  },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.classList.toggle("overflow-hidden", isMenuOpen);
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isMenuOpen]);

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

  const renderLinks = (
    variant: "desktop" | "mobile",
    onLinkClick?: () => void
  ) =>
    NAV_LINKS.map(({ href, label, icon }) => {
      const active = isActive(href);
      const sharedClasses =
        "inline-flex items-center font-semibold rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500";

      return (
        <Link
          key={href}
          href={href}
          onClick={variant === "mobile" ? onLinkClick : undefined}
          className={`${sharedClasses} ${
            variant === "desktop"
              ? "px-4 py-2 text-sm"
              : "px-3 py-3 text-base w-full justify-between"
          } ${active ? "bg-blue-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`}
        >
          {icon}
          <span>{label}</span>
        </Link>
      );
    });

  return (
    <nav className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <Image
              src="/logo-coinsandbanknotes.png"
              alt="Coins and Banknotes logo"
              width={180}
              height={60}
              className="h-14 w-auto"
              priority
            />
          </Link>

          <div className="hidden md:flex space-x-1">{renderLinks("desktop")}</div>

          <button
            type="button"
            aria-label="Toggle navigation menu"
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        <div
          className={`md:hidden overflow-hidden transition-[max-height] duration-300 ${
            isMenuOpen ? "max-h-96 pb-4" : "max-h-0"
          }`}
        >
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
            {renderLinks("mobile", () => setIsMenuOpen(false))}
          </div>
        </div>
      </div>
    </nav>
  );
}
