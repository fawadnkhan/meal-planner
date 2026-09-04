'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AuthGuard } from '@/components/AuthGuard';
import { Navbar } from '@/components/Navbar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { recipesApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { Recipe } from '@/types';

export default function RecipesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => recipesApi.list().then((r) => r.data.recipes as Recipe[]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => recipesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Recipe deleted');
      setDeleteId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const importMutation = useMutation({
    mutationFn: (data: unknown) => recipesApi.import(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Recipe imported!');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        importMutation.mutate(data);
      } catch {
        toast.error('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const recipes = data ?? [];
  const filtered = recipes.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
              <p className="text-sm text-gray-500 mt-1">
                {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <input
                type="hidden"
                ref={importRef as React.RefObject<HTMLInputElement>}
                accept=".json"
                onChange={handleImport}
              />
              <input
                type="file"
                id="import-file"
                accept=".json"
                className="sr-only"
                onChange={handleImport}
                aria-label="Import recipe from JSON file"
              />
              <label htmlFor="import-file" className="btn-secondary cursor-pointer text-sm">
                📥 Import
              </label>
              <Link href="/recipes/new" className="btn-primary text-sm">
                + New Recipe
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <label htmlFor="search" className="sr-only">Search recipes</label>
            <input
              id="search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes…"
              className="input max-w-sm"
            />
          </div>

          {/* Grid */}
          {isLoading ? (
            <LoadingSpinner className="py-20" />
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              {search ? (
                <p className="text-gray-500">No recipes match &quot;{search}&quot;</p>
              ) : (
                <div>
                  <p className="text-gray-400 text-lg mb-4">No recipes yet</p>
                  <Link href="/recipes/new" className="btn-primary">
                    Create your first recipe
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <ul
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              role="list"
              aria-label="Recipe list"
            >
              {filtered.map((recipe) => (
                <li key={recipe.id}>
                  <RecipeCard recipe={recipe} onDelete={setDeleteId} />
                </li>
              ))}
            </ul>
          )}
        </main>

        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
          title="Delete Recipe"
          message="Are you sure you want to delete this recipe? This cannot be undone."
          isLoading={deleteMutation.isPending}
        />
      </div>
    </AuthGuard>
  );
}
