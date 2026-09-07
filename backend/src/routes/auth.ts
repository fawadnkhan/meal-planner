import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, socialLogin, linkSocial, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  register
);

router.post('/social', socialLogin);
router.post('/social/link', authenticate, linkSocial);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  login
);

// GET /api/auth/me
router.get('/me', authenticate, getMe);

export default router;
