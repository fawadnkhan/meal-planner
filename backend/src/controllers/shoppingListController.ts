import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

interface ShoppingItem {
  ingredientId: string;
  name: string;
  totalQuantity: number;
  unit: string | null;
}

export async function getShoppingList(req: AuthRequest, res: Response): Promise<void> {
  try {
    const mealPlan = await prisma.mealPlan.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        items: {
          include: {
            recipe: {
              include: {
                ingredients: {
                  include: { ingredient: true },
                },
              },
            },
          },
        },
      },
    });

    if (!mealPlan) {
      res.status(404).json({ error: 'Meal plan not found' });
      return;
    }

    // Aggregate ingredients across all meal plan items
    const aggregated = new Map<string, ShoppingItem>();

    for (const item of mealPlan.items) {
      const scaleFactor = item.servings / item.recipe.servings;

      for (const ri of item.recipe.ingredients) {
        const key = `${ri.ingredientId}__${ri.unit || ''}`;
        const existing = aggregated.get(key);

        if (existing) {
          existing.totalQuantity += ri.quantity * scaleFactor;
        } else {
          aggregated.set(key, {
            ingredientId: ri.ingredientId,
            name: ri.ingredient.name,
            totalQuantity: ri.quantity * scaleFactor,
            unit: ri.unit,
          });
        }
      }
    }

    const shoppingList = Array.from(aggregated.values())
      .map((item) => ({
        ...item,
        totalQuantity: Math.round(item.totalQuantity * 100) / 100,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      mealPlanId: mealPlan.id,
      mealPlanName: mealPlan.name,
      weekStart: mealPlan.weekStart,
      shoppingList,
    });
  } catch (err) {
    console.error('Shopping list error:', err);
    res.status(500).json({ error: 'Failed to generate shopping list' });
  }
}
