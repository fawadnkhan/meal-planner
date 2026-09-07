export type User = { id: string; name: string; email: string };
export type Recipe = { id: string; title: string; description?: string | null; imageUrl?: string | null; servings: number; prepTime?: number | null; cookTime?: number | null; ingredients: { id: string; quantity: number; unit?: string | null; ingredient: { id: string; name: string } }[] };
export type MealPlanItem = { id: string; dayOfWeek: number; mealType: string; servings: number; recipe: Pick<Recipe, 'id' | 'title' | 'imageUrl'> };
export type MealPlan = { id: string; name: string; weekStart: string; items: MealPlanItem[] };
export type ShoppingItem = { ingredientId: string; name: string; totalQuantity: number; unit?: string | null };
