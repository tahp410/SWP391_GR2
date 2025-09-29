import express from "express";
import {
  createVoucher,
  getVouchers,
  getVoucherById,
  updateVoucher,
  deleteVoucher,
} from "../controllers/voucherController.js";

import protect, { adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Lấy tất cả vouchers (public)
router.get("/", getVouchers);

// Lấy voucher theo ID (public)
router.get("/:id", getVoucherById);

// Tạo voucher (chỉ admin)
router.post("/", protect, adminOnly, createVoucher);

// Cập nhật voucher (chỉ admin)
router.put("/:id", protect, adminOnly, updateVoucher);

// Xóa voucher (chỉ admin)
router.delete("/:id", protect, adminOnly, deleteVoucher);

export default router;
