import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const recipeSelect = {
  id: true,
  title: true,
  description: true,
  instructions: true,
  servings: true,
  prepTime: true,
  cookTime: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
  ingredients: {
    select: {
      id: true,
      quantity: true,
      unit: true,
      notes: true,
      ingredient: { select: { id: true, name: true } },
    },
  },
};

export async function listRecipes(req: AuthRequest, res: Response): Promise<void> {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { userId: req.userId },
      select: recipeSelect,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ recipes });
  } catch (err) {
    console.error('List recipes error:', err);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
}

export async function getRecipe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const recipe = await prisma.recipe.findFirst({
      where: { id: req.params.id, userId: req.userId },
      select: recipeSelect,
    });

    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }
    res.json({ recipe });
  } catch (err) {
    console.error('Get recipe error:', err);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
}

export async function createRecipe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, description, instructions, servings, prepTime, cookTime, imageUrl, ingredients } = req.body;

    const recipe = await prisma.recipe.create({
      data: {
        title,
        description,
        instructions,
        servings: servings || 1,
        prepTime,
        cookTime,
        imageUrl,
        userId: req.userId!,
        ingredients: ingredients?.length
          ? {
              create: await Promise.all(
                ingredients.map(async (ing: { name: string; quantity: number; unit?: string; notes?: string }) => {
                  const ingredient = await prisma.ingredient.upsert({
                    where: { name: ing.name.toLowerCase().trim() },
                    create: { name: ing.name.toLowerCase().trim() },
                    update: {},
                  });
                  return {
                    quantity: ing.quantity,
                    unit: ing.unit,
                    notes: ing.notes,
                    ingredientId: ingredient.id,
                  };
                })
              ),
            }
          : undefined,
      },
      select: recipeSelect,
    });

    res.status(201).json({ recipe });
  } catch (err) {
    console.error('Create recipe error:', err);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
}

export async function updateRecipe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const existing = await prisma.recipe.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    const { title, description, instructions, servings, prepTime, cookTime, imageUrl, ingredients } = req.body;

    // Delete and re-create ingredients for simplicity
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: req.params.id } });

    const recipe = await prisma.recipe.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        instructions,
        servings,
        prepTime,
        cookTime,
        imageUrl,
        ingredients: ingredients?.length
          ? {
              create: await Promise.all(
                ingredients.map(async (ing: { name: string; quantity: number; unit?: string; notes?: string }) => {
                  const ingredient = await prisma.ingredient.upsert({
                    where: { name: ing.name.toLowerCase().trim() },
                    create: { name: ing.name.toLowerCase().trim() },
                    update: {},
                  });
                  return {
                    quantity: ing.quantity,
                    unit: ing.unit,
                    notes: ing.notes,
                    ingredientId: ingredient.id,
                  };
                })
              ),
            }
          : undefined,
      },
      select: recipeSelect,
    });

    res.json({ recipe });
  } catch (err) {
    console.error('Update recipe error:', err);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
}

export async function deleteRecipe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const existing = await prisma.recipe.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    await prisma.recipe.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error('Delete recipe error:', err);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
}

export async function exportRecipe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const recipe = await prisma.recipe.findFirst({
      where: { id: req.params.id, userId: req.userId },
      select: recipeSelect,
    });

    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    res.setHeader('Content-Disposition', `attachment; filename="${recipe.title.replace(/\s+/g, '_')}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(recipe);
  } catch (err) {
    console.error('Export recipe error:', err);
    res.status(500).json({ error: 'Failed to export recipe' });
  }
}

export async function importRecipe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = req.body;

    if (!data.title) {
      res.status(400).json({ error: 'Recipe title is required for import' });
      return;
    }

    const recipe = await prisma.recipe.create({
      data: {
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        servings: data.servings || 1,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        imageUrl: data.imageUrl,
        userId: req.userId!,
        ingredients: data.ingredients?.length
          ? {
              create: await Promise.all(
                data.ingredients.map(async (ing: { ingredient: { name: string }; quantity: number; unit?: string; notes?: string }) => {
                  const ingredient = await prisma.ingredient.upsert({
                    where: { name: ing.ingredient.name.toLowerCase().trim() },
                    create: { name: ing.ingredient.name.toLowerCase().trim() },
                    update: {},
                  });
                  return {
                    quantity: ing.quantity,
                    unit: ing.unit,
                    notes: ing.notes,
                    ingredientId: ingredient.id,
                  };
                })
              ),
            }
          : undefined,
      },
      select: recipeSelect,
    });

    res.status(201).json({ recipe });
  } catch (err) {
    console.error('Import recipe error:', err);
    res.status(500).json({ error: 'Failed to import recipe' });
  }
}
