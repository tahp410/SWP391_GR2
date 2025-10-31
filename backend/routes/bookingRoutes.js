import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { getSeatsForShowtime, holdSeats, releaseSeats, createBooking } from '../controllers/bookingController.js';

const router = express.Router();

// Public: view seat map (status reflects holds/booked)
router.get('/showtimes/:id/seats', getSeatsForShowtime);

// Auth required for holding and booking
router.post('/showtimes/:id/hold', protect, holdSeats);
router.post('/showtimes/:id/release', protect, releaseSeats);

router.post('/', protect, createBooking);

export default router;


