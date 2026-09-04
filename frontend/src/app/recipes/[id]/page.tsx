'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AuthGuard } from '@/components/AuthGuard';
import { Navbar } from '@/components/Navbar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { recipesApi } from '@/lib/api';
import { formatMinutes, getErrorMessage } from '@/lib/utils';
import { Recipe } from '@/types';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipesApi.get(id).then((r) => r.data.recipe as Recipe),
  });

  const deleteMutation = useMutation({
    mutationFn: () => recipesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Recipe deleted');
      router.push('/recipes');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleExport = async () => {
    try {
      const res = await recipesApi.export(id);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data?.title.replace(/\s+/g, '_') ?? 'recipe'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Recipe exported!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
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
            <p className="text-gray-500 mb-4">Recipe not found.</p>
            <Link href="/recipes" className="btn-primary">Back to Recipes</Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const totalTime = (data.prepTime ?? 0) + (data.cookTime ?? 0);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <Link href="/recipes" className="text-sm text-gray-400 hover:text-gray-600">
              ← Recipes
            </Link>
          </nav>

          {/* Hero image */}
          {data.imageUrl && (
            <div className="relative h-56 sm:h-72 rounded-2xl overflow-hidden mb-6">
              <Image src={data.imageUrl} alt={data.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
            </div>
          )}

          {/* Title & actions */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{data.title}</h1>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={handleExport} className="btn-secondary text-sm">📤 Export</button>
              <Link href={`/recipes/${id}/edit`} className="btn-secondary text-sm">✏️ Edit</Link>
              <button onClick={() => setShowDelete(true)} className="btn-danger text-sm">🗑️ Delete</button>
            </div>
          </div>

          {/* Description */}
          {data.description && (
            <p className="text-gray-600 mb-6">{data.description}</p>
          )}

          {/* Meta pills */}
          <div className="flex flex-wrap gap-3 mb-8" role="list" aria-label="Recipe details">
            <span className="badge badge-green" role="listitem">🍴 {data.servings} servings</span>
            {data.prepTime != null && <span className="badge badge-blue" role="listitem">⏱ {formatMinutes(data.prepTime)} prep</span>}
            {data.cookTime != null && <span className="badge badge-yellow" role="listitem">🔥 {formatMinutes(data.cookTime)} cook</span>}
            {totalTime > 0 && <span className="badge badge-purple" role="listitem">⏰ {formatMinutes(totalTime)} total</span>}
          </div>

          {/* Two-column: ingredients + instructions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ingredients */}
            <section className="card">
              <h2 className="text-base font-semibold mb-3">Ingredients ({data.ingredients.length})</h2>
              {data.ingredients.length === 0 ? (
                <p className="text-sm text-gray-400">No ingredients listed.</p>
              ) : (
                <ul className="space-y-2" role="list">
                  {data.ingredients.map((ri) => (
                    <li key={ri.id} className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" aria-hidden="true" />
                      <span className="font-medium capitalize">{ri.ingredient.name}</span>
                      <span className="text-gray-400 ml-auto">
                        {ri.quantity} {ri.unit ?? ''} {ri.notes ? `· ${ri.notes}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Instructions */}
            <section className="card">
              <h2 className="text-base font-semibold mb-3">Instructions</h2>
              {data.instructions ? (
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {data.instructions}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No instructions provided.</p>
              )}
            </section>
          </div>
        </main>

        <ConfirmDialog
          isOpen={showDelete}
          onClose={() => setShowDelete(false)}
          onConfirm={() => deleteMutation.mutate()}
          title="Delete Recipe"
          message={`Delete "${data.title}"? This cannot be undone.`}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </AuthGuard>
  );
}
