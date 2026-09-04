'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { MealPlan, MealPlanItem, MealType, DAY_NAMES, MEAL_TYPES, Recipe } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  mealPlan: MealPlan;
  recipes: Recipe[];
  onAddItem: (dayOfWeek: number, mealType: MealType, recipeId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onMoveItem: (itemId: string, dayOfWeek: number, mealType: MealType) => void;
}

const MEAL_COLORS: Record<MealType, string> = {
  breakfast: 'bg-yellow-50 border-yellow-200',
  lunch:     'bg-green-50 border-green-200',
  dinner:    'bg-blue-50 border-blue-200',
  snack:     'bg-purple-50 border-purple-200',
};

const MEAL_BADGE: Record<MealType, string> = {
  breakfast: 'badge-yellow',
  lunch:     'badge-green',
  dinner:    'badge-blue',
  snack:     'badge-purple',
};

// ── Draggable meal card ────────────────────────────────────────────────────────

function DraggableMealCard({ item, onRemove }: { item: MealPlanItem; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative rounded-lg border p-2 text-xs cursor-grab active:cursor-grabbing transition-shadow',
        MEAL_COLORS[item.mealType]
      )}
      aria-label={`${item.recipe.title} - ${item.mealType}`}
      {...listeners}
      {...attributes}
    >
      <p className="font-medium text-gray-800 line-clamp-1">{item.recipe.title}</p>
      <p className="text-gray-500 mt-0.5">{item.servings} serving{item.servings !== 1 ? 's' : ''}</p>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-1 right-1 text-gray-300 hover:text-red-500 transition-colors"
        aria-label={`Remove ${item.recipe.title}`}
        onPointerDown={(e) => e.stopPropagation()}
      >
        ×
      </button>
    </div>
  );
}

// ── Droppable cell ─────────────────────────────────────────────────────────────

function DroppableCell({
  id,
  dayOfWeek,
  mealType,
  items,
  onAdd,
  onRemove,
  recipes,
}: {
  id: string;
  dayOfWeek: number;
  mealType: MealType;
  items: MealPlanItem[];
  onAdd: (recipeId: string) => void;
  onRemove: (itemId: string) => void;
  recipes: Recipe[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { dayOfWeek, mealType } });
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = recipes.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[80px] rounded-lg border-2 border-dashed p-1.5 transition-colors',
        isOver ? 'border-brand-400 bg-brand-50' : 'border-gray-200 bg-gray-50/50'
      )}
      aria-label={`${DAY_NAMES[dayOfWeek]} ${mealType} slot`}
    >
      {/* Existing items */}
      <div className="space-y-1">
        {items.map((item) => (
          <DraggableMealCard
            key={item.id}
            item={item}
            onRemove={() => onRemove(item.id)}
          />
        ))}
      </div>

      {/* Add button */}
      {!showPicker && (
        <button
          onClick={() => setShowPicker(true)}
          className="mt-1 w-full text-xs text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded py-1 transition-colors"
          aria-label={`Add recipe to ${DAY_NAMES[dayOfWeek]} ${mealType}`}
        >
          + Add
        </button>
      )}

      {/* Recipe picker */}
      {showPicker && (
        <div className="mt-1 bg-white rounded-lg border border-gray-200 shadow-lg z-10 relative">
          <div className="p-1.5">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="input text-xs py-1"
              autoFocus
              aria-label="Search recipes to add"
            />
          </div>
          <ul className="max-h-40 overflow-y-auto" role="listbox" aria-label="Available recipes">
            {filtered.slice(0, 20).map((r) => (
              <li key={r.id}>
                <button
                  role="option"
                  aria-selected="false"
                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-brand-50 hover:text-brand-700 transition-colors"
                  onClick={() => { onAdd(r.id); setShowPicker(false); setSearch(''); }}
                >
                  {r.title}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-2 py-1.5 text-xs text-gray-400">No recipes found</li>
            )}
          </ul>
          <div className="p-1 border-t border-gray-100">
            <button
              onClick={() => { setShowPicker(false); setSearch(''); }}
              className="w-full text-xs text-gray-400 hover:text-gray-600 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Week Calendar ──────────────────────────────────────────────────────────────

export function WeekCalendar({ mealPlan, recipes, onAddItem, onRemoveItem, onMoveItem }: Props) {
  const [activeItem, setActiveItem] = useState<MealPlanItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const item = event.active.data.current?.item as MealPlanItem;
    setActiveItem(item ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over || !active.data.current) return;

    const item = active.data.current.item as MealPlanItem;
    const target = over.data.current as { dayOfWeek: number; mealType: MealType } | undefined;
    if (!target) return;

    const sameSlot = item.dayOfWeek === target.dayOfWeek && item.mealType === target.mealType;
    if (sameSlot) return;

    onMoveItem(item.id, target.dayOfWeek, target.mealType);
  };

  const getItems = (day: number, meal: MealType) =>
    mealPlan.items.filter((i) => i.dayOfWeek === day && i.mealType === meal);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="min-w-[640px]">
          {/* Day headers */}
          <div className="grid grid-cols-8 gap-1 mb-1">
            <div className="text-xs font-medium text-gray-400 p-2" aria-hidden="true">Meal</div>
            {DAY_NAMES.map((day) => (
              <div key={day} className="text-xs font-semibold text-center text-gray-700 p-2 bg-white rounded-lg border border-gray-200">
                {day.slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Meal type rows */}
          {MEAL_TYPES.map((mealType) => (
            <div key={mealType} className="grid grid-cols-8 gap-1 mb-1">
              {/* Row label */}
              <div className="flex items-center justify-end pr-2">
                <span className={cn('badge text-xs capitalize', MEAL_BADGE[mealType])}>
                  {mealType}
                </span>
              </div>

              {/* Day cells */}
              {DAY_NAMES.map((_, dayIndex) => (
                <DroppableCell
                  key={`${dayIndex}-${mealType}`}
                  id={`${dayIndex}-${mealType}`}
                  dayOfWeek={dayIndex}
                  mealType={mealType}
                  items={getItems(dayIndex, mealType)}
                  onAdd={(recipeId) => onAddItem(dayIndex, mealType, recipeId)}
                  onRemove={onRemoveItem}
                  recipes={recipes}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeItem && (
          <div className={cn('rounded-lg border p-2 text-xs shadow-lg cursor-grabbing opacity-90', MEAL_COLORS[activeItem.mealType])}>
            <p className="font-medium text-gray-800">{activeItem.recipe.title}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
