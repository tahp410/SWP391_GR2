// routes/comboRoutes.js
import express from 'express';
import {
  getCombos,
  getAllCombosAdmin,
  getComboById,
  createCombo,
  updateCombo,
  deleteCombo,
  permanentDeleteCombo,
  getAvailableItems
} from '../controllers/comboController.js';

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Combo routes working!' });
});

// Admin routes (must be before /:id routes)
router.get('/admin/all', getAllCombosAdmin);
router.get('/admin/available-items', getAvailableItems);

// Public routes
router.get('/', getCombos);
router.get('/:id', getComboById);

// CRUD routes
router.post('/', createCombo);
router.put('/:id', updateCombo);
router.delete('/:id', deleteCombo);
router.delete('/:id/permanent', permanentDeleteCombo);

export default router;