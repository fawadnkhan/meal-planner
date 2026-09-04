'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Recipe } from '@/types';
import { formatMinutes } from '@/lib/utils';

interface Props {
  recipe: Recipe;
  onDelete?: (id: string) => void;
  draggable?: boolean;
}

export function RecipeCard({ recipe, onDelete }: Props) {
  return (
    <article className="card group hover:shadow-md transition-shadow flex flex-col gap-3">
      {/* Image */}
      {recipe.imageUrl ? (
        <div className="relative h-40 -mx-4 -mt-4 rounded-t-xl overflow-hidden">
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      ) : (
        <div className="h-24 -mx-4 -mt-4 rounded-t-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
          <span className="text-4xl" aria-hidden="true">🍽️</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors line-clamp-1">
          <Link href={`/recipes/${recipe.id}`} className="focus:outline-none focus:ring-2 focus:ring-brand-500 rounded">
            {recipe.title}
          </Link>
        </h3>
        {recipe.description && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{recipe.description}</p>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
        <span title="Servings">🍴 {recipe.servings} servings</span>
        {recipe.prepTime != null && <span title="Prep time">⏱ {formatMinutes(recipe.prepTime)} prep</span>}
        {recipe.cookTime != null && <span title="Cook time">🔥 {formatMinutes(recipe.cookTime)} cook</span>}
        <span>{recipe.ingredients.length} ingredients</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <Link href={`/recipes/${recipe.id}`} className="btn-secondary flex-1 text-xs text-center">
          View
        </Link>
        <Link href={`/recipes/${recipe.id}/edit`} className="btn-ghost text-xs">
          Edit
        </Link>
        {onDelete && (
          <button
            onClick={() => onDelete(recipe.id)}
            className="btn-ghost text-xs text-red-500 hover:text-red-700"
            aria-label={`Delete ${recipe.title}`}
          >
            Delete
          </button>
        )}
      </div>
    </article>
  );
}
