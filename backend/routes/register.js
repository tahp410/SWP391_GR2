import express from 'express';
import { registerUser, sendVerificationCode, verifyCode } from '../controllers/registerController.js';

const router = express.Router();

// @route   POST /api/auth/send-verification
// @desc    Send email verification code
// @access  Public
router.post('/auth/send-verification', sendVerificationCode);

// @route   POST /api/auth/verify-code
// @desc    Verify email verification code
// @access  Public
router.post('/auth/verify-code', verifyCode);

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/auth/register', registerUser);

export default router;