import express from 'express';
import protect, { adminOnly, adminOrEmployee } from '../middleware/authMiddleware.js';
import { 
  getSeatsForShowtime, 
  holdSeats, 
  releaseSeats, 
  createBooking,
  getBookingById,
  generatePaymentQR,
  cancelPayment,
  confirmCashPayment,
  getUserPurchaseHistory,
  getAllPurchaseHistory,
  getBookingByQR,
  checkInTicket
} from '../controllers/bookingController.js';

const router = express.Router();

// Public: view seat map (status reflects holds/booked)
router.get('/showtimes/:id/seats', getSeatsForShowtime);

// Auth required for holding and booking
router.post('/showtimes/:id/hold', protect, holdSeats);
router.post('/showtimes/:id/release', protect, releaseSeats);

router.post('/', protect, createBooking);

// Payment flow: generate QR code
router.post('/payment/qr', protect, generatePaymentQR);

// Payment flow: user marks as purchased
// router.post('/payment/purchased', protect, markAsPurchased); // deprecated

// Payment flow: user cancels payment
router.post('/payment/cancel', protect, cancelPayment); // used by PayOS cancel return

// Admin: confirm or reject payment
// router.post('/payment/confirm', protect, adminOnly, confirmPayment); // deprecated

// Employee: confirm cash payment
router.post('/payment/confirm-cash', protect, adminOrEmployee, confirmCashPayment);

// Purchase history (must be before /:id route)
router.get('/history/user', protect, getUserPurchaseHistory);
router.get('/history/all', protect, adminOrEmployee, getAllPurchaseHistory);

// Employee check-in routes
router.post('/checkin/qr', protect, adminOrEmployee, getBookingByQR);
router.post('/checkin/confirm', protect, adminOrEmployee, checkInTicket);

// Get booking by ID (must be last to avoid catching /history routes)
router.get('/:id', protect, getBookingById);

export default router;


