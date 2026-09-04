import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const mealPlanSelect = {
  id: true,
  name: true,
  weekStart: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      dayOfWeek: true,
      mealType: true,
      servings: true,
      recipe: {
        select: {
          id: true,
          title: true,
          description: true,
          prepTime: true,
          cookTime: true,
          servings: true,
          imageUrl: true,
        },
      },
    },
    orderBy: [{ dayOfWeek: 'asc' as const }, { mealType: 'asc' as const }],
  },
};

export async function listMealPlans(req: AuthRequest, res: Response): Promise<void> {
  try {
    const mealPlans = await prisma.mealPlan.findMany({
      where: { userId: req.userId },
      select: mealPlanSelect,
      orderBy: { weekStart: 'desc' },
    });
    res.json({ mealPlans });
  } catch (err) {
    console.error('List meal plans error:', err);
    res.status(500).json({ error: 'Failed to fetch meal plans' });
  }
}

export async function getMealPlan(req: AuthRequest, res: Response): Promise<void> {
  try {
    const mealPlan = await prisma.mealPlan.findFirst({
      where: { id: req.params.id, userId: req.userId },
      select: mealPlanSelect,
    });

    if (!mealPlan) {
      res.status(404).json({ error: 'Meal plan not found' });
      return;
    }
    res.json({ mealPlan });
  } catch (err) {
    console.error('Get meal plan error:', err);
    res.status(500).json({ error: 'Failed to fetch meal plan' });
  }
}

export async function createMealPlan(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, weekStart } = req.body;

    const mealPlan = await prisma.mealPlan.create({
      data: {
        name,
        weekStart: new Date(weekStart),
        userId: req.userId!,
      },
      select: mealPlanSelect,
    });

    res.status(201).json({ mealPlan });
  } catch (err) {
    console.error('Create meal plan error:', err);
    res.status(500).json({ error: 'Failed to create meal plan' });
  }
}

export async function updateMealPlan(req: AuthRequest, res: Response): Promise<void> {
  try {
    const existing = await prisma.mealPlan.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Meal plan not found' });
      return;
    }

    const { name, weekStart } = req.body;

    const mealPlan = await prisma.mealPlan.update({
      where: { id: req.params.id },
      data: {
        name,
        weekStart: weekStart ? new Date(weekStart) : undefined,
      },
      select: mealPlanSelect,
    });

    res.json({ mealPlan });
  } catch (err) {
    console.error('Update meal plan error:', err);
    res.status(500).json({ error: 'Failed to update meal plan' });
  }
}

export async function deleteMealPlan(req: AuthRequest, res: Response): Promise<void> {
  try {
    const existing = await prisma.mealPlan.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Meal plan not found' });
      return;
    }

    await prisma.mealPlan.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error('Delete meal plan error:', err);
    res.status(500).json({ error: 'Failed to delete meal plan' });
  }
}

export async function addMealPlanItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const mealPlan = await prisma.mealPlan.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!mealPlan) {
      res.status(404).json({ error: 'Meal plan not found' });
      return;
    }

    const { recipeId, dayOfWeek, mealType, servings } = req.body;

    // Verify recipe belongs to user
    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, userId: req.userId },
    });

    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    const item = await prisma.mealPlanItem.create({
      data: {
        mealPlanId: req.params.id,
        recipeId,
        dayOfWeek,
        mealType,
        servings: servings || 1,
      },
      select: {
        id: true,
        dayOfWeek: true,
        mealType: true,
        servings: true,
        recipe: {
          select: { id: true, title: true, description: true, prepTime: true, cookTime: true, servings: true, imageUrl: true },
        },
      },
    });

    res.status(201).json({ item });
  } catch (err) {
    console.error('Add meal plan item error:', err);
    res.status(500).json({ error: 'Failed to add item to meal plan' });
  }
}

export async function updateMealPlanItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const item = await prisma.mealPlanItem.findFirst({
      where: { id: req.params.itemId, mealPlanId: req.params.id },
      include: { mealPlan: true },
    });

    if (!item || item.mealPlan.userId !== req.userId) {
      res.status(404).json({ error: 'Meal plan item not found' });
      return;
    }

    const { recipeId, dayOfWeek, mealType, servings } = req.body;

    const updated = await prisma.mealPlanItem.update({
      where: { id: req.params.itemId },
      data: { recipeId, dayOfWeek, mealType, servings },
      select: {
        id: true,
        dayOfWeek: true,
        mealType: true,
        servings: true,
        recipe: {
          select: { id: true, title: true, description: true, prepTime: true, cookTime: true, servings: true, imageUrl: true },
        },
      },
    });

    res.json({ item: updated });
  } catch (err) {
    console.error('Update meal plan item error:', err);
    res.status(500).json({ error: 'Failed to update meal plan item' });
  }
}

export async function removeMealPlanItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const item = await prisma.mealPlanItem.findFirst({
      where: { id: req.params.itemId, mealPlanId: req.params.id },
      include: { mealPlan: true },
    });

    if (!item || item.mealPlan.userId !== req.userId) {
      res.status(404).json({ error: 'Meal plan item not found' });
      return;
    }

    await prisma.mealPlanItem.delete({ where: { id: req.params.itemId } });
    res.status(204).send();
  } catch (err) {
    console.error('Remove meal plan item error:', err);
    res.status(500).json({ error: 'Failed to remove meal plan item' });
  }
}
