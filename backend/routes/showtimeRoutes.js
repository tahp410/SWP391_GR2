import express from 'express';
import {
  getShowtimes,
  getShowtimeById,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  getShowtimesByBranch,
  getShowtimesByTheater,
  getShowtimesByDateRange
} from '../controllers/showtimeController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/showtimes
// @desc    Get all showtimes
// @access  Private/Admin
router.get('/', getShowtimes);

// @route   GET /api/showtimes/date-range
// @desc    Get showtimes by date range
// @access  Private/Admin
router.get('/date-range', getShowtimesByDateRange);

// @route   GET /api/showtimes/branch/:branchId
// @desc    Get showtimes by branch
// @access  Private/Admin
router.get('/branch/:branchId', getShowtimesByBranch);

// @route   GET /api/showtimes/theater/:theaterId
// @desc    Get showtimes by theater
// @access  Private/Admin
router.get('/theater/:theaterId', getShowtimesByTheater);

// @route   GET /api/showtimes/:id
// @desc    Get showtime by ID
// @access  Private/Admin
router.get('/:id', getShowtimeById);

// @route   POST /api/showtimes
// @desc    Create new showtime
// @access  Private/Admin
router.post('/', createShowtime);

// @route   PUT /api/showtimes/:id
// @desc    Update showtime
// @access  Private/Admin
router.put('/:id', updateShowtime);

// @route   DELETE /api/showtimes/:id
// @desc    Delete showtime
// @access  Private/Admin
router.delete('/:id', deleteShowtime);

export default router;