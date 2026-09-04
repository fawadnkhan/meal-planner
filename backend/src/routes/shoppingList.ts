import { Router } from 'express';
import { getShoppingList } from '../controllers/shoppingListController';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/shopping-list/:id  (meal plan ID)
router.get('/:id', authenticate, getShoppingList);

export default router;
