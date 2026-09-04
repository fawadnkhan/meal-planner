'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AuthGuard } from '@/components/AuthGuard';
import { Navbar } from '@/components/Navbar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { WeekCalendar } from '@/components/meal-plans/WeekCalendar';
import { mealPlansApi, recipesApi } from '@/lib/api';
import { formatDate, getErrorMessage } from '@/lib/utils';
import { MealPlan, MealType, Recipe } from '@/types';

export default function MealPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: mealPlan, isLoading: loadingPlan } = useQuery({
    queryKey: ['meal-plan', id],
    queryFn: () => mealPlansApi.get(id).then((r) => r.data.mealPlan as MealPlan),
  });

  const { data: recipesData, isLoading: loadingRecipes } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => recipesApi.list().then((r) => r.data.recipes as Recipe[]),
  });

  const addItemMutation = useMutation({
    mutationFn: ({ recipeId, dayOfWeek, mealType }: { recipeId: string; dayOfWeek: number; mealType: MealType }) =>
      mealPlansApi.addItem(id, { recipeId, dayOfWeek, mealType, servings: 1 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meal-plan', id] }),
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => mealPlansApi.removeItem(id, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meal-plan', id] }),
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const moveItemMutation = useMutation({
    mutationFn: ({ itemId, dayOfWeek, mealType }: { itemId: string; dayOfWeek: number; mealType: MealType }) =>
      mealPlansApi.updateItem(id, itemId, { dayOfWeek, mealType }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meal-plan', id] }),
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (loadingPlan || loadingRecipes) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50"><Navbar /><LoadingSpinner className="py-20" /></div>
      </AuthGuard>
    );
  }

  if (!mealPlan) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50"><Navbar />
          <div className="max-w-2xl mx-auto px-4 py-20 text-center">
            <p className="text-gray-500 mb-4">Meal plan not found.</p>
            <Link href="/meal-plans" className="btn-primary">Back to Meal Plans</Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const recipes = recipesData ?? [];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <nav aria-label="Breadcrumb" className="mb-1">
                <Link href="/meal-plans" className="text-sm text-gray-400 hover:text-gray-600">
                  ← Meal Plans
                </Link>
              </nav>
              <h1 className="text-2xl font-bold text-gray-900">{mealPlan.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Week of {formatDate(mealPlan.weekStart)} · {mealPlan.items.length} meals planned
              </p>
            </div>
            <Link href={`/shopping-list/${id}`} className="btn-primary flex items-center gap-2">
              🛒 Shopping List
            </Link>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 mb-4 text-xs" aria-label="Meal type legend">
            {(['breakfast','lunch','dinner','snack'] as MealType[]).map((t) => (
              <span key={t} className="badge capitalize" style={{
                backgroundColor: { breakfast: '#fef9c3', lunch: '#dcfce7', dinner: '#dbeafe', snack: '#f3e8ff' }[t],
                color: '#374151',
              }}>
                {t}
              </span>
            ))}
            <span className="text-gray-400 ml-2">Drag meals between slots to reschedule</span>
          </div>

          {/* Calendar */}
          {recipes.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-gray-400 mb-3">You need recipes before planning meals.</p>
              <Link href="/recipes/new" className="btn-primary text-sm">Create a Recipe</Link>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="p-4">
                <WeekCalendar
                  mealPlan={mealPlan}
                  recipes={recipes}
                  onAddItem={(day, meal, recipeId) =>
                    addItemMutation.mutate({ dayOfWeek: day, mealType: meal, recipeId })
                  }
                  onRemoveItem={(itemId) => removeItemMutation.mutate(itemId)}
                  onMoveItem={(itemId, day, meal) =>
                    moveItemMutation.mutate({ itemId, dayOfWeek: day, mealType: meal })
                  }
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
