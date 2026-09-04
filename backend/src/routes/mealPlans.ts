import { Router } from 'express';
import { body } from 'express-validator';
import {
  listMealPlans,
  getMealPlan,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  addMealPlanItem,
  updateMealPlanItem,
  removeMealPlanItem,
} from '../controllers/mealPlanController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

// GET  /api/meal-plans
router.get('/', listMealPlans);

// GET  /api/meal-plans/:id
router.get('/:id', getMealPlan);

// POST /api/meal-plans
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('weekStart').isISO8601().withMessage('weekStart must be a valid date'),
  ],
  validate,
  createMealPlan
);

// PUT  /api/meal-plans/:id
router.put('/:id', updateMealPlan);

// DELETE /api/meal-plans/:id
router.delete('/:id', deleteMealPlan);

// POST /api/meal-plans/:id/items
router.post(
  '/:id/items',
  [
    body('recipeId').notEmpty().withMessage('recipeId is required'),
    body('dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('dayOfWeek must be 0–6'),
    body('mealType').isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
    body('servings').optional().isInt({ min: 1 }),
  ],
  validate,
  addMealPlanItem
);

// PUT  /api/meal-plans/:id/items/:itemId
router.put('/:id/items/:itemId', updateMealPlanItem);

// DELETE /api/meal-plans/:id/items/:itemId
router.delete('/:id/items/:itemId', removeMealPlanItem);

export default router;
