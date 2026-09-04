'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { RecipeFormData } from '@/types';

interface Props {
  defaultValues?: Partial<RecipeFormData>;
  onSubmit: (data: RecipeFormData) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function RecipeForm({ defaultValues, onSubmit, isLoading, submitLabel = 'Save Recipe' }: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RecipeFormData>({
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      servings: 1,
      prepTime: undefined,
      cookTime: undefined,
      imageUrl: '',
      ingredients: [{ name: '', quantity: 1, unit: '', notes: '' }],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* Basic info */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Basic Info</legend>

        <div>
          <label htmlFor="title" className="label">Recipe Title <span aria-hidden="true" className="text-red-500">*</span></label>
          <input
            id="title"
            className="input"
            placeholder="e.g. Spaghetti Bolognese"
            aria-required="true"
            aria-invalid={!!errors.title}
            {...register('title', { required: 'Title is required' })}
          />
          {errors.title && <p className="mt-1 text-xs text-red-600" role="alert">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="label">Description</label>
          <textarea
            id="description"
            rows={2}
            className="input"
            placeholder="Brief description of the recipe…"
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="servings" className="label">Servings</label>
            <input
              id="servings"
              type="number"
              min="1"
              className="input"
              {...register('servings', { valueAsNumber: true, min: 1 })}
            />
          </div>
          <div>
            <label htmlFor="prepTime" className="label">Prep (mins)</label>
            <input
              id="prepTime"
              type="number"
              min="0"
              className="input"
              placeholder="0"
              {...register('prepTime', { valueAsNumber: true })}
            />
          </div>
          <div>
            <label htmlFor="cookTime" className="label">Cook (mins)</label>
            <input
              id="cookTime"
              type="number"
              min="0"
              className="input"
              placeholder="0"
              {...register('cookTime', { valueAsNumber: true })}
            />
          </div>
        </div>

        <div>
          <label htmlFor="imageUrl" className="label">Image URL</label>
          <input
            id="imageUrl"
            type="url"
            className="input"
            placeholder="https://example.com/image.jpg"
            {...register('imageUrl')}
          />
        </div>
      </fieldset>

      {/* Ingredients */}
      <fieldset className="space-y-3">
        <div className="flex items-center justify-between">
          <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Ingredients
          </legend>
          <button
            type="button"
            onClick={() => append({ name: '', quantity: 1, unit: '', notes: '' })}
            className="btn-ghost text-xs text-brand-600"
            aria-label="Add ingredient"
          >
            + Add Ingredient
          </button>
        </div>

        {fields.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-2">No ingredients yet.</p>
        )}

        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-12 gap-2 items-start" role="group" aria-label={`Ingredient ${index + 1}`}>
            <div className="col-span-4">
              <label className="sr-only" htmlFor={`ing-name-${index}`}>Name</label>
              <input
                id={`ing-name-${index}`}
                className="input"
                placeholder="Ingredient name"
                {...register(`ingredients.${index}.name`, { required: true })}
              />
            </div>
            <div className="col-span-2">
              <label className="sr-only" htmlFor={`ing-qty-${index}`}>Quantity</label>
              <input
                id={`ing-qty-${index}`}
                type="number"
                min="0"
                step="0.01"
                className="input"
                placeholder="Qty"
                {...register(`ingredients.${index}.quantity`, { valueAsNumber: true })}
              />
            </div>
            <div className="col-span-2">
              <label className="sr-only" htmlFor={`ing-unit-${index}`}>Unit</label>
              <input
                id={`ing-unit-${index}`}
                className="input"
                placeholder="Unit"
                {...register(`ingredients.${index}.unit`)}
              />
            </div>
            <div className="col-span-3">
              <label className="sr-only" htmlFor={`ing-notes-${index}`}>Notes</label>
              <input
                id={`ing-notes-${index}`}
                className="input"
                placeholder="Notes"
                {...register(`ingredients.${index}.notes`)}
              />
            </div>
            <div className="col-span-1 flex items-center justify-center pt-2">
              <button
                type="button"
                onClick={() => remove(index)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                aria-label={`Remove ingredient ${index + 1}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </fieldset>

      {/* Instructions */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Instructions</legend>
        <textarea
          id="instructions"
          rows={6}
          className="input"
          placeholder="Step 1: …&#10;Step 2: …"
          {...register('instructions')}
        />
      </fieldset>

      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={isLoading} className="btn-primary" aria-busy={isLoading}>
          {isLoading ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
