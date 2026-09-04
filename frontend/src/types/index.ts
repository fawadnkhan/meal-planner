export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
}

export interface RecipeIngredient {
  id: string;
  quantity: number;
  unit: string | null;
  notes: string | null;
  ingredient: Ingredient;
}

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  servings: number;
  prepTime: number | null;
  cookTime: number | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  ingredients: RecipeIngredient[];
}

export interface RecipeFormData {
  title: string;
  description?: string;
  instructions?: string;
  servings: number;
  prepTime?: number;
  cookTime?: number;
  imageUrl?: string;
  ingredients: {
    name: string;
    quantity: number;
    unit?: string;
    notes?: string;
  }[];
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlanItemRecipe {
  id: string;
  title: string;
  description: string | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number;
  imageUrl: string | null;
}

export interface MealPlanItem {
  id: string;
  dayOfWeek: number;
  mealType: MealType;
  servings: number;
  recipe: MealPlanItemRecipe;
}

export interface MealPlan {
  id: string;
  name: string;
  weekStart: string;
  createdAt: string;
  updatedAt: string;
  items: MealPlanItem[];
}

export interface ShoppingListItem {
  ingredientId: string;
  name: string;
  totalQuantity: number;
  unit: string | null;
}

export interface ShoppingList {
  mealPlanId: string;
  mealPlanName: string;
  weekStart: string;
  shoppingList: ShoppingListItem[];
}

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
