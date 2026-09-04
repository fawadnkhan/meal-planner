'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AuthGuard } from '@/components/AuthGuard';
import { Navbar } from '@/components/Navbar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { RecipeForm } from '@/components/recipes/RecipeForm';
import { recipesApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { Recipe, RecipeFormData } from '@/types';

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipesApi.get(id).then((r) => r.data.recipe as Recipe),
  });

  const mutation = useMutation({
    mutationFn: (formData: RecipeFormData) => recipesApi.update(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', id] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Recipe updated!');
      router.push(`/recipes/${id}`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

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

  const defaultValues: Partial<RecipeFormData> = {
    title: data.title,
    description: data.description ?? '',
    instructions: data.instructions ?? '',
    servings: data.servings,
    prepTime: data.prepTime ?? undefined,
    cookTime: data.cookTime ?? undefined,
    imageUrl: data.imageUrl ?? '',
    ingredients: data.ingredients.map((ri) => ({
      name: ri.ingredient.name,
      quantity: ri.quantity,
      unit: ri.unit ?? '',
      notes: ri.notes ?? '',
    })),
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-6 flex items-center gap-3">
            <Link href={`/recipes/${id}`} className="text-gray-400 hover:text-gray-600" aria-label="Back to recipe">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Edit Recipe</h1>
          </div>

          <div className="card">
            <RecipeForm
              defaultValues={defaultValues}
              onSubmit={(formData) => mutation.mutate(formData)}
              isLoading={mutation.isPending}
              submitLabel="Save Changes"
            />
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
