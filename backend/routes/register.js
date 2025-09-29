import express from 'express';
import { registerUser } from '../controllers/registerController.js';

const router = express.Router();

// @route   POST /api/auth/registern
// @desc    Register a new user
// @access  Public
router.post('/auth/register', registerUser);

export default router;
