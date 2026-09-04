import request from 'supertest';
import app from '../src/index';
import { prisma, createTestUser, cleanDatabase } from './helpers';

let token: string;
let userId: string;

beforeAll(async () => {
  await cleanDatabase();
  const result = await createTestUser({ email: 'recipe_user@example.com' });
  token = result.token;
  userId = result.user.id;
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

// Helper to create a recipe via API
async function createRecipe(overrides = {}) {
  const payload = {
    title: 'Test Pasta',
    description: 'A simple pasta dish',
    servings: 2,
    prepTime: 10,
    cookTime: 20,
    ingredients: [{ name: 'Pasta', quantity: 200, unit: 'g' }],
    ...overrides,
  };
  const res = await request(app)
    .post('/api/recipes')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
  return res;
}

describe('GET /api/recipes', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(401);
  });

  it('returns an empty array when no recipes exist', async () => {
    const res = await request(app)
      .get('/api/recipes')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.recipes).toEqual([]);
  });
});

describe('POST /api/recipes', () => {
  it('creates a recipe with ingredients', async () => {
    const res = await createRecipe();

    expect(res.status).toBe(201);
    expect(res.body.recipe).toMatchObject({
      title: 'Test Pasta',
      servings: 2,
      prepTime: 10,
      cookTime: 20,
    });
    expect(res.body.recipe.ingredients).toHaveLength(1);
    expect(res.body.recipe.ingredients[0].ingredient.name).toBe('pasta');
  });

  it('rejects missing title with 400', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${token}`)
      .send({ servings: 2 });

    expect(res.status).toBe(400);
  });

  it('requires authentication', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .send({ title: 'Unauthenticated' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/recipes/:id', () => {
  let recipeId: string;

  beforeAll(async () => {
    const res = await createRecipe({ title: 'Detail Recipe' });
    recipeId = res.body.recipe.id;
  });

  it('returns the recipe by ID', async () => {
    const res = await request(app)
      .get(`/api/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.recipe.id).toBe(recipeId);
    expect(res.body.recipe.title).toBe('Detail Recipe');
  });

  it('returns 404 for unknown ID', async () => {
    const res = await request(app)
      .get('/api/recipes/nonexistent-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("returns 404 for another user's recipe", async () => {
    const other = await createTestUser({ email: 'other_recipe@example.com' });
    const res = await request(app)
      .get(`/api/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${other.token}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/recipes/:id', () => {
  let recipeId: string;

  beforeAll(async () => {
    const res = await createRecipe({ title: 'Update Me' });
    recipeId = res.body.recipe.id;
  });

  it('updates the recipe title and ingredients', async () => {
    const res = await request(app)
      .put(`/api/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Updated Title',
        servings: 4,
        ingredients: [
          { name: 'Tomato', quantity: 3, unit: 'pcs' },
          { name: 'Basil', quantity: 5, unit: 'leaves' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.recipe.title).toBe('Updated Title');
    expect(res.body.recipe.servings).toBe(4);
    expect(res.body.recipe.ingredients).toHaveLength(2);
  });
});

describe('DELETE /api/recipes/:id', () => {
  it('deletes the recipe', async () => {
    const created = await createRecipe({ title: 'Delete Me' });
    const id = created.body.recipe.id;

    const deleteRes = await request(app)
      .delete(`/api/recipes/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(204);

    // Confirm it's gone
    const getRes = await request(app)
      .get(`/api/recipes/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });

  it('returns 404 for already-deleted recipe', async () => {
    const res = await request(app)
      .delete('/api/recipes/ghost-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/recipes/:id/export', () => {
  it('exports a recipe as JSON', async () => {
    const created = await createRecipe({ title: 'Export Me' });
    const id = created.body.recipe.id;

    const res = await request(app)
      .get(`/api/recipes/${id}/export`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.title).toBe('Export Me');
  });
});

describe('POST /api/recipes/import', () => {
  it('imports a recipe from JSON', async () => {
    const payload = {
      title: 'Imported Soup',
      servings: 3,
      ingredients: [
        { ingredient: { name: 'Carrot' }, quantity: 2, unit: 'pcs' },
      ],
    };

    const res = await request(app)
      .post('/api/recipes/import')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.recipe.title).toBe('Imported Soup');
    expect(res.body.recipe.ingredients).toHaveLength(1);
  });

  it('rejects import without title', async () => {
    const res = await request(app)
      .post('/api/recipes/import')
      .set('Authorization', `Bearer ${token}`)
      .send({ servings: 2 });

    expect(res.status).toBe(400);
  });
});
