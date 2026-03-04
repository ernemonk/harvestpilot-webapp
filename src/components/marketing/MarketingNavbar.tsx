'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function MarketingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100'
          : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image src="/logo.png" alt="HarvestPilot" width={36} height={36} className="h-9 w-auto object-contain" />
            <span className="text-xl font-extrabold tracking-tight text-gray-900 group-hover:text-harvest-green transition-colors">
              HarvestPilot
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <ul className="hidden md:flex items-center gap-1">
            {[
              { label: 'Features', href: '/#features' },
              { label: 'How It Works', href: '/#how-it-works' },
              { label: 'Pricing', href: '/#pricing' },
              { label: 'Blog', href: '/blog' },
              { label: 'FAQ', href: '/#faq' },
            ].map((link) => (
              <li key={link.label}>
                {link.href.startsWith('/blog') ? (
                  <Link
                    href={link.href}
                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-harvest-green rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    href={link.href}
                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-harvest-green rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-harvest-green rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-harvest-green rounded-lg hover:bg-emerald-600 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-6 pt-2 border-t border-gray-100 animate-fade-in">
            <div className="flex flex-col gap-1">
              {['Features', 'How It Works', 'Pricing', 'Blog', 'FAQ'].map((label) => (
                <a
                  key={label}
                  href={label === 'Blog' ? '/blog' : `/#${label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2.5 text-gray-700 hover:text-harvest-green hover:bg-gray-50 rounded-lg font-medium transition"
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-2.5 text-center font-semibold text-harvest-green border-2 border-harvest-green rounded-lg hover:bg-harvest-light transition"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-2.5 text-center font-semibold text-white bg-harvest-green rounded-lg hover:bg-emerald-600 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
