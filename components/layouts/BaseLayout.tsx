'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import UserProfile from '@/components/auth/UserProfile';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/app/providers/AuthProvider';

interface BaseLayoutProps {
  children: React.ReactNode;
}

export default function BaseLayout({ children }: BaseLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoized toggle handler
  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prevState => !prevState);
  }, []);

  const links = [{ href: '/', label: 'Home' }];

  // Only add authenticated routes if user is logged in
  if (mounted && user) {
    links.push({ href: '/dashboard', label: 'Dashboard' }, { href: '/profile', label: 'Profile' });
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="bg-background border-b border-accent sticky top-0 z-10" role="banner">
        <nav
          className="container mx-auto px-4 py-4"
          role="navigation"
          aria-label="Main navigation"
          data-testid="navbar"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold" aria-label="Home page">
                My App
              </Link>
            </div>

            {/* Desktop menu */}
            <nav
              className="hidden md:flex space-x-4"
              data-testid="desktop-menu"
              aria-label="Desktop navigation"
            >
              <ul className="flex space-x-4">
                {links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="px-3 py-2 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <UserProfile />

              {/* Mobile menu button */}
              <button
                type="button"
                onClick={toggleMenu}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-muted hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary-500 ml-2"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                aria-label="Main menu"
                data-testid="mobile-menu-button"
              >
                <span className="sr-only">{isMenuOpen ? 'Close main menu' : 'Open main menu'}</span>
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div
              id="mobile-menu"
              className="md:hidden pt-2 pb-3"
              role="navigation"
              aria-label="Mobile navigation"
              data-testid="mobile-menu"
            >
              <ul className="space-y-1">
                {links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6" data-testid="main-content">
        {children}
      </main>

      {/* Footer with copyright information */}
      <footer role="contentinfo" className="mt-auto py-8 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-700 dark:text-gray-300">
              © {new Date().getFullYear()}{' '}
              {process.env.NEXT_PUBLIC_APP_NAME || '{{YOUR_PROJECT_NAME}}'}. All rights reserved.
            </div>
            <div className="mt-4 md:mt-0">
              <nav aria-label="Footer Navigation">
                <ul className="flex space-x-6">
                  <li>
                    <Link
                      href="/privacy"
                      className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                    >
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                    >
                      Terms
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                    >
                      Contact
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
