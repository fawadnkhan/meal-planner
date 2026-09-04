'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AuthGuard } from '@/components/AuthGuard';
import { Navbar } from '@/components/Navbar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuthStore } from '@/lib/store';
import { recipesApi, mealPlansApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Recipe, MealPlan } from '@/types';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: recipesData, isLoading: loadingRecipes } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => recipesApi.list().then((r) => r.data.recipes as Recipe[]),
  });

  const { data: mealPlansData, isLoading: loadingPlans } = useQuery({
    queryKey: ['meal-plans'],
    queryFn: () => mealPlansApi.list().then((r) => r.data.mealPlans as MealPlan[]),
  });

  const recipes = recipesData ?? [];
  const mealPlans = mealPlansData ?? [];
  const latestPlan = mealPlans[0];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Greeting */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Good day, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="mt-1 text-gray-500">Here&apos;s your meal planning overview.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard
              icon="📖"
              label="Total Recipes"
              value={loadingRecipes ? '…' : recipes.length.toString()}
              href="/recipes"
            />
            <StatCard
              icon="📅"
              label="Meal Plans"
              value={loadingPlans ? '…' : mealPlans.length.toString()}
              href="/meal-plans"
            />
            <StatCard
              icon="🛒"
              label="Active Plan"
              value={latestPlan ? latestPlan.name : 'None'}
              href={latestPlan ? `/meal-plans/${latestPlan.id}` : '/meal-plans'}
            />
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent recipes */}
            <section className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">Recent Recipes</h2>
                <Link href="/recipes/new" className="btn-primary text-xs">
                  + New Recipe
                </Link>
              </div>
              {loadingRecipes ? (
                <LoadingSpinner size="sm" className="py-6" />
              ) : recipes.length === 0 ? (
                <EmptyState
                  message="No recipes yet"
                  action={{ href: '/recipes/new', label: 'Add your first recipe' }}
                />
              ) : (
                <ul className="space-y-2" role="list">
                  {recipes.slice(0, 5).map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/recipes/${r.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-sm" aria-hidden="true">🍽️</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                          <p className="text-xs text-gray-400">{r.ingredients.length} ingredients</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {recipes.length > 5 && (
                <Link href="/recipes" className="block mt-3 text-xs text-brand-600 hover:underline text-center">
                  View all {recipes.length} recipes →
                </Link>
              )}
            </section>

            {/* Upcoming meal plans */}
            <section className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">Meal Plans</h2>
                <Link href="/meal-plans" className="btn-primary text-xs">
                  + New Plan
                </Link>
              </div>
              {loadingPlans ? (
                <LoadingSpinner size="sm" className="py-6" />
              ) : mealPlans.length === 0 ? (
                <EmptyState
                  message="No meal plans yet"
                  action={{ href: '/meal-plans', label: 'Create your first plan' }}
                />
              ) : (
                <ul className="space-y-2" role="list">
                  {mealPlans.slice(0, 5).map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/meal-plans/${p.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-sm" aria-hidden="true">📅</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">
                            Week of {formatDate(p.weekStart)} · {p.items.length} meals
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

function StatCard({ icon, label, value, href }: { icon: string; label: string; value: string; href: string }) {
  return (
    <Link href={href} className="card flex items-center gap-4 hover:shadow-md transition-shadow">
      <span className="text-3xl" aria-hidden="true">{icon}</span>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </Link>
  );
}

function EmptyState({ message, action }: { message: string; action: { href: string; label: string } }) {
  return (
    <div className="text-center py-6">
      <p className="text-sm text-gray-400 mb-2">{message}</p>
      <Link href={action.href} className="text-sm text-brand-600 hover:underline">{action.label}</Link>
    </div>
  );
}
