import { Router } from 'express';
import { listIngredients } from '../controllers/ingredientController';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/ingredients?search=<term>
router.get('/', authenticate, listIngredients);

export default router;
