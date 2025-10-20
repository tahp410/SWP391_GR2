import express from 'express';
import {
  getTheaters,
  getTheaterById,
  createTheater,
  updateTheater,
  deleteTheater,
  getTheatersByBranch,
  getSeatLayoutByTheater
} from '../controllers/theaterController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/theaters
// @desc    Get all theaters
// @access  Private/Admin
router.get('/', getTheaters);

// @route   GET /api/theaters/branch/:branchId
// @desc    Get theaters by branch
// @access  Private/Admin
router.get('/branch/:branchId', getTheatersByBranch);

// @route   GET /api/theaters/:id/seat-layout
// @desc    Get seat layout by theater
// @access  Private/Admin
// IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
router.get('/:id/seat-layout', getSeatLayoutByTheater);

// @route   GET /api/theaters/:id
// @desc    Get theater by ID
// @access  Private/Admin
router.get('/:id', getTheaterById);

// @route   POST /api/theaters
// @desc    Create new theater
// @access  Private/Admin
router.post('/', createTheater);

// @route   PUT /api/theaters/:id
// @desc    Update theater
// @access  Private/Admin
router.put('/:id', updateTheater);

// @route   DELETE /api/theaters/:id
// @desc    Delete theater
// @access  Private/Admin
router.delete('/:id', deleteTheater);

export default router;