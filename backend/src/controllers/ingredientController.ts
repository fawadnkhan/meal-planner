import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export async function listIngredients(req: Request, res: Response): Promise<void> {
  try {
    const { search } = req.query;

    const ingredients = await prisma.ingredient.findMany({
      where: search
        ? { name: { contains: String(search).toLowerCase(), mode: 'insensitive' } }
        : undefined,
      orderBy: { name: 'asc' },
      take: 50,
    });

    res.json({ ingredients });
  } catch (err) {
    console.error('List ingredients error:', err);
    res.status(500).json({ error: 'Failed to fetch ingredients' });
  }
}
