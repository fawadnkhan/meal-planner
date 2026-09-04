'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AuthGuard } from '@/components/AuthGuard';
import { Navbar } from '@/components/Navbar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { MealPlanForm } from '@/components/meal-plans/MealPlanForm';
import { mealPlansApi } from '@/lib/api';
import { formatDate, getErrorMessage } from '@/lib/utils';
import { MealPlan } from '@/types';

export default function MealPlansPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['meal-plans'],
    queryFn: () => mealPlansApi.list().then((r) => r.data.mealPlans as MealPlan[]),
  });

  const createMutation = useMutation({
    mutationFn: (d: { name: string; weekStart: string }) => mealPlansApi.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plans'] });
      toast.success('Meal plan created!');
      setShowCreate(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mealPlansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plans'] });
      toast.success('Plan deleted');
      setDeleteId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const plans = data ?? [];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meal Plans</h1>
              <p className="text-sm text-gray-500 mt-1">{plans.length} plan{plans.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              + New Plan
            </button>
          </div>

          {isLoading ? (
            <LoadingSpinner className="py-20" />
          ) : plans.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg mb-4">No meal plans yet</p>
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                Create your first plan
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
              {plans.map((plan) => (
                <li key={plan.id}>
                  <article className="card hover:shadow-md transition-shadow flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-semibold text-gray-900 line-clamp-1">{plan.name}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Week of {formatDate(plan.weekStart)}
                        </p>
                      </div>
                      <span className="badge badge-green flex-shrink-0">{plan.items.length} meals</span>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <Link href={`/meal-plans/${plan.id}`} className="btn-primary flex-1 text-xs text-center">
                        Open Calendar
                      </Link>
                      <Link href={`/shopping-list/${plan.id}`} className="btn-secondary text-xs">
                        🛒 List
                      </Link>
                      <button
                        onClick={() => setDeleteId(plan.id)}
                        className="btn-ghost text-xs text-red-500"
                        aria-label={`Delete ${plan.name}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </main>

        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Meal Plan">
          <MealPlanForm
            onSubmit={(d) => createMutation.mutate(d)}
            isLoading={createMutation.isPending}
          />
        </Modal>

        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
          title="Delete Meal Plan"
          message="Delete this meal plan and all its items? This cannot be undone."
          isLoading={deleteMutation.isPending}
        />
      </div>
    </AuthGuard>
  );
}
