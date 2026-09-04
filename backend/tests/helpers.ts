import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Use a separate test DB client
export const prisma = new PrismaClient();

/** Create a test user and return { user, token } */
export async function createTestUser(overrides: { email?: string; name?: string; password?: string } = {}) {
  const email = overrides.email ?? `test_${Date.now()}@example.com`;
  const name = overrides.name ?? 'Test User';
  const password = overrides.password ?? 'password123';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, name, passwordHash },
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1d' }
  );

  return { user, token, password };
}

/** Clean all data from test tables in safe order */
export async function cleanDatabase() {
  await prisma.mealPlanItem.deleteMany();
  await prisma.mealPlan.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.user.deleteMany();
}
