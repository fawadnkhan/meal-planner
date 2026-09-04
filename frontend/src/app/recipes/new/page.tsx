'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AuthGuard } from '@/components/AuthGuard';
import { Navbar } from '@/components/Navbar';
import { RecipeForm } from '@/components/recipes/RecipeForm';
import { recipesApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { RecipeFormData } from '@/types';
import Link from 'next/link';

export default function NewRecipePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: RecipeFormData) => recipesApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Recipe created!');
      router.push(`/recipes/${res.data.recipe.id}`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-6 flex items-center gap-3">
            <Link href="/recipes" className="text-gray-400 hover:text-gray-600" aria-label="Back to recipes">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">New Recipe</h1>
          </div>

          <div className="card">
            <RecipeForm
              onSubmit={(data) => mutation.mutate(data)}
              isLoading={mutation.isPending}
              submitLabel="Create Recipe"
            />
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
