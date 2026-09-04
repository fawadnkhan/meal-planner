import request from 'supertest';
import app from '../src/index';
import { prisma, createTestUser, cleanDatabase } from './helpers';

let token: string;
let userId: string;
let recipeId: string;

beforeAll(async () => {
  await cleanDatabase();

  const result = await createTestUser({ email: 'mp_user@example.com' });
  token = result.token;
  userId = result.user.id;

  // Create a recipe to use in meal plan items
  const recipeRes = await request(app)
    .post('/api/recipes')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Plan Recipe', servings: 2 });

  recipeId = recipeRes.body.recipe.id;
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

function thisMonday(): string {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function createPlan(name = 'Test Week') {
  return request(app)
    .post('/api/meal-plans')
    .set('Authorization', `Bearer ${token}`)
    .send({ name, weekStart: thisMonday() });
}

describe('GET /api/meal-plans', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/meal-plans');
    expect(res.status).toBe(401);
  });

  it('returns empty list when no plans exist', async () => {
    const res = await request(app)
      .get('/api/meal-plans')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.mealPlans).toEqual([]);
  });
});

describe('POST /api/meal-plans', () => {
  it('creates a meal plan', async () => {
    const res = await createPlan('My Week');

    expect(res.status).toBe(201);
    expect(res.body.mealPlan).toMatchObject({ name: 'My Week' });
    expect(res.body.mealPlan.items).toEqual([]);
  });

  it('rejects missing name with 400', async () => {
    const res = await request(app)
      .post('/api/meal-plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ weekStart: thisMonday() });

    expect(res.status).toBe(400);
  });

  it('rejects invalid weekStart date with 400', async () => {
    const res = await request(app)
      .post('/api/meal-plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bad Date', weekStart: 'not-a-date' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/meal-plans/:id', () => {
  let planId: string;

  beforeAll(async () => {
    const res = await createPlan('Fetch Plan');
    planId = res.body.mealPlan.id;
  });

  it('returns the meal plan by ID', async () => {
    const res = await request(app)
      .get(`/api/meal-plans/${planId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.mealPlan.id).toBe(planId);
  });

  it('returns 404 for unknown ID', async () => {
    const res = await request(app)
      .get('/api/meal-plans/nonexistent')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('Meal plan items', () => {
  let planId: string;

  beforeAll(async () => {
    const res = await createPlan('Items Plan');
    planId = res.body.mealPlan.id;
  });

  it('adds an item to the meal plan', async () => {
    const res = await request(app)
      .post(`/api/meal-plans/${planId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ recipeId, dayOfWeek: 0, mealType: 'breakfast', servings: 2 });

    expect(res.status).toBe(201);
    expect(res.body.item).toMatchObject({
      dayOfWeek: 0,
      mealType: 'breakfast',
      servings: 2,
    });
    expect(res.body.item.recipe.id).toBe(recipeId);
  });

  it('rejects invalid mealType with 400', async () => {
    const res = await request(app)
      .post(`/api/meal-plans/${planId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ recipeId, dayOfWeek: 1, mealType: 'brunch', servings: 1 });

    expect(res.status).toBe(400);
  });

  it('rejects out-of-range dayOfWeek with 400', async () => {
    const res = await request(app)
      .post(`/api/meal-plans/${planId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ recipeId, dayOfWeek: 7, mealType: 'lunch', servings: 1 });

    expect(res.status).toBe(400);
  });

  it('updates a meal plan item', async () => {
    // First add an item
    const addRes = await request(app)
      .post(`/api/meal-plans/${planId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ recipeId, dayOfWeek: 2, mealType: 'lunch', servings: 1 });

    const itemId = addRes.body.item.id;

    const updateRes = await request(app)
      .put(`/api/meal-plans/${planId}/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ dayOfWeek: 3, mealType: 'dinner', servings: 3 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.item.dayOfWeek).toBe(3);
    expect(updateRes.body.item.mealType).toBe('dinner');
    expect(updateRes.body.item.servings).toBe(3);
  });

  it('removes a meal plan item', async () => {
    const addRes = await request(app)
      .post(`/api/meal-plans/${planId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ recipeId, dayOfWeek: 4, mealType: 'snack', servings: 1 });

    const itemId = addRes.body.item.id;

    const delRes = await request(app)
      .delete(`/api/meal-plans/${planId}/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(204);
  });
});

describe('DELETE /api/meal-plans/:id', () => {
  it('deletes a meal plan', async () => {
    const created = await createPlan('Delete This');
    const planId = created.body.mealPlan.id;

    const del = await request(app)
      .delete(`/api/meal-plans/${planId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(del.status).toBe(204);

    const get = await request(app)
      .get(`/api/meal-plans/${planId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(get.status).toBe(404);
  });
});

describe('GET /api/shopping-list/:id', () => {
  it('generates an aggregated shopping list', async () => {
    // Create recipe with ingredients
    const rRes = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Shopping Recipe',
        servings: 2,
        ingredients: [
          { name: 'flour', quantity: 200, unit: 'g' },
          { name: 'eggs', quantity: 3, unit: 'pcs' },
        ],
      });
    const shopRecipeId = rRes.body.recipe.id;

    // Create plan and add recipe twice (2 different days)
    const planRes = await createPlan('Shopping Plan');
    const planId = planRes.body.mealPlan.id;

    await request(app)
      .post(`/api/meal-plans/${planId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ recipeId: shopRecipeId, dayOfWeek: 0, mealType: 'lunch', servings: 2 });

    await request(app)
      .post(`/api/meal-plans/${planId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ recipeId: shopRecipeId, dayOfWeek: 1, mealType: 'dinner', servings: 2 });

    const res = await request(app)
      .get(`/api/shopping-list/${planId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.shoppingList).toBeInstanceOf(Array);
    expect(res.body.shoppingList.length).toBeGreaterThan(0);

    // flour: 200g × (2 servings / 2 recipe servings) × 2 items = 400g
    const flour = res.body.shoppingList.find((i: { name: string }) => i.name === 'flour');
    expect(flour).toBeDefined();
    expect(flour.totalQuantity).toBe(400);
    expect(flour.unit).toBe('g');
  });

  it('returns 404 for unknown meal plan', async () => {
    const res = await request(app)
      .get('/api/shopping-list/nonexistent')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
