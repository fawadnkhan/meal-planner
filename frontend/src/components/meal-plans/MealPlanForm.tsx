'use client';

import { useForm } from 'react-hook-form';
import { getMondayOfWeek, formatDate } from '@/lib/utils';

interface FormData {
  name: string;
  weekStart: string;
}

interface Props {
  onSubmit: (data: { name: string; weekStart: string }) => void;
  isLoading?: boolean;
  defaultValues?: Partial<FormData>;
}

export function MealPlanForm({ onSubmit, isLoading, defaultValues }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: defaultValues?.name ?? '',
      weekStart: defaultValues?.weekStart ?? getMondayOfWeek().toISOString().split('T')[0],
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label htmlFor="plan-name" className="label">Plan Name <span className="text-red-500" aria-hidden="true">*</span></label>
        <input
          id="plan-name"
          className="input"
          placeholder="e.g. Week of Jan 6"
          aria-required="true"
          aria-invalid={!!errors.name}
          {...register('name', { required: 'Plan name is required' })}
        />
        {errors.name && <p className="mt-1 text-xs text-red-600" role="alert">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="week-start" className="label">Week Start (Monday)</label>
        <input
          id="week-start"
          type="date"
          className="input"
          {...register('weekStart', { required: true })}
        />
      </div>

      <div className="flex justify-end gap-3">
        <button type="submit" disabled={isLoading} className="btn-primary" aria-busy={isLoading}>
          {isLoading ? 'Saving…' : 'Save Plan'}
        </button>
      </div>
    </form>
  );
}
