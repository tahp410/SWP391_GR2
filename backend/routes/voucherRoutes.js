import express from "express";
import {
  createVoucher,
  getVouchers,
  getVoucherById,
  updateVoucher,
  deleteVoucher,
} from "../controllers/voucherController.js";

// 'protect' ensures the user is authenticated; 'adminOnly' restricts access to admin users only.
import protect, { adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all vouchers (public) - Lấy tất cả vouchers (công khai)
router.get("/", getVouchers);

// Get voucher by ID (public) - Lấy voucher theo ID (công khai)
router.get("/:id", getVoucherById);

// Tạo voucher (chỉ admin)
// 'protect' ensures the user is authenticated, while 'adminOnly' restricts access to admin users (authorization).
router.post("/", protect, adminOnly, createVoucher);

// Update voucher (admin only) - Cập nhật voucher (chỉ admin)
router.put("/:id", protect, adminOnly, updateVoucher);

// Delete voucher (admin only) - Xóa voucher (chỉ admin)
router.delete("/:id", protect, adminOnly, deleteVoucher);

export default router;
