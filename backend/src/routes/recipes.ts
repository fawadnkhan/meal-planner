import { Router } from 'express';
import { body } from 'express-validator';
import {
  listRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  exportRecipe,
  importRecipe,
} from '../controllers/recipeController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// All recipe routes require authentication
router.use(authenticate);

const recipeValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('servings').optional().isInt({ min: 1 }).withMessage('Servings must be a positive integer'),
  body('prepTime').optional().isInt({ min: 0 }),
  body('cookTime').optional().isInt({ min: 0 }),
  body('ingredients').optional().isArray(),
  body('ingredients.*.name').optional().trim().notEmpty(),
  body('ingredients.*.quantity').optional().isFloat({ min: 0 }),
];

// GET  /api/recipes
router.get('/', listRecipes);

// GET  /api/recipes/:id
router.get('/:id', getRecipe);

// GET  /api/recipes/:id/export
router.get('/:id/export', exportRecipe);

// POST /api/recipes/import
router.post('/import', importRecipe);

// POST /api/recipes
router.post('/', recipeValidation, validate, createRecipe);

// PUT  /api/recipes/:id
router.put('/:id', recipeValidation, validate, updateRecipe);

// DELETE /api/recipes/:id
router.delete('/:id', deleteRecipe);

export default router;
