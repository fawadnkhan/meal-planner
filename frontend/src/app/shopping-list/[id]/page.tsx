'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AuthGuard } from '@/components/AuthGuard';
import { Navbar } from '@/components/Navbar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { shoppingListApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { ShoppingList, ShoppingListItem } from '@/types';

export default function ShoppingListPage() {
  const { id } = useParams<{ id: string }>();
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['shopping-list', id],
    queryFn: () => shoppingListApi.get(id).then((r) => r.data as ShoppingList),
  });

  const toggleItem = (ingredientId: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(ingredientId)) next.delete(ingredientId);
      else next.add(ingredientId);
      return next;
    });
  };

  const handlePrint = () => window.print();

  const handleCopy = async () => {
    if (!data) return;
    const text = data.shoppingList
      .map((i) => `${checked.has(i.ingredientId) ? '✓' : '○'} ${i.name}: ${i.totalQuantity} ${i.unit ?? ''}`.trim())
      .join('\n');
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50"><Navbar /><LoadingSpinner className="py-20" /></div>
      </AuthGuard>
    );
  }

  if (!data) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50"><Navbar />
          <div className="max-w-2xl mx-auto px-4 py-20 text-center">
            <p className="text-gray-500 mb-4">Shopping list not found.</p>
            <Link href="/meal-plans" className="btn-primary">Back to Meal Plans</Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const remaining = data.shoppingList.filter((i) => !checked.has(i.ingredientId));
  const done = data.shoppingList.filter((i) => checked.has(i.ingredientId));
  const progress = data.shoppingList.length > 0
    ? Math.round((done.length / data.shoppingList.length) * 100)
    : 0;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="mb-6">
            <nav aria-label="Breadcrumb" className="mb-1">
              <Link href={`/meal-plans/${id}`} className="text-sm text-gray-400 hover:text-gray-600">
                ← {data.mealPlanName}
              </Link>
            </nav>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Shopping List</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Week of {formatDate(data.weekStart)} · {data.shoppingList.length} items
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCopy} className="btn-secondary text-sm">📋 Copy</button>
                <button onClick={handlePrint} className="btn-secondary text-sm print:hidden">🖨️ Print</button>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {data.shoppingList.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <span>{done.length} of {data.shoppingList.length} items collected</span>
                <span>{progress}%</span>
              </div>
              <div
                className="h-2 bg-gray-200 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${progress}% of shopping list complete`}
              >
                <div
                  className="h-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {data.shoppingList.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-gray-400 mb-3">No ingredients in this meal plan yet.</p>
              <Link href={`/meal-plans/${id}`} className="btn-primary text-sm">Add meals to plan</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Remaining */}
              {remaining.length > 0 && (
                <section className="card">
                  <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    To Buy ({remaining.length})
                  </h2>
                  <ul className="space-y-1" role="list">
                    {remaining.map((item) => (
                      <ShoppingItem
                        key={item.ingredientId}
                        item={item}
                        checked={false}
                        onToggle={() => toggleItem(item.ingredientId)}
                      />
                    ))}
                  </ul>
                </section>
              )}

              {/* Done */}
              {done.length > 0 && (
                <section className="card opacity-70">
                  <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                    Collected ({done.length})
                  </h2>
                  <ul className="space-y-1" role="list">
                    {done.map((item) => (
                      <ShoppingItem
                        key={item.ingredientId}
                        item={item}
                        checked={true}
                        onToggle={() => toggleItem(item.ingredientId)}
                      />
                    ))}
                  </ul>
                </section>
              )}

              {progress === 100 && (
                <div className="card bg-brand-50 border-brand-200 text-center py-4">
                  <p className="text-brand-700 font-semibold">🎉 All items collected!</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

function ShoppingItem({
  item,
  checked,
  onToggle,
}: {
  item: ShoppingListItem;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          aria-label={`Mark ${item.name} as collected`}
        />
        <span className={`flex-1 text-sm capitalize ${checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {item.name}
        </span>
        <span className="text-sm text-gray-500 font-medium flex-shrink-0">
          {item.totalQuantity} {item.unit ?? ''}
        </span>
      </label>
    </li>
  );
}
