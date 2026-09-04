'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/recipes', label: 'Recipes' },
  { href: '/meal-plans', label: 'Meal Plans' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-brand-700 font-bold text-lg"
          aria-label="Meal Planner home"
        >
          <span aria-hidden="true">🥗</span>
          <span>Meal Planner</span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden sm:flex items-center gap-1" role="list">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith(link.href)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
                aria-current={pathname.startsWith(link.href) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* User section */}
        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden sm:block text-sm text-gray-500">
              {user.name}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="btn-secondary text-sm"
            aria-label="Log out"
          >
            Log out
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="sm:hidden border-t border-gray-100 px-4 py-2 flex gap-2">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex-1 text-center px-2 py-1.5 rounded-lg text-xs font-medium transition-colors',
              pathname.startsWith(link.href)
                ? 'bg-brand-50 text-brand-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
            aria-current={pathname.startsWith(link.href) ? 'page' : undefined}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
