// routes/itemRoutes.js
import express from "express";
import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  searchItems,
} from "../controllers/itemController.js";
import protect, { adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes (không cần authentication)
router.get("/", getAllItems); // GET /api/items - Lấy tất cả items
router.get("/search", searchItems); // GET /api/items/search?q=... - Tìm kiếm items
router.get("/:id", getItemById); // GET /api/items/:id - Lấy item theo ID

// Protected routes (cần authentication)
router.post("/", protect, adminOnly, createItem); // POST /api/items - Tạo item mới
router.put("/:id", protect, adminOnly, updateItem); // PUT /api/items/:id - Cập nhật item
router.delete("/:id", protect, adminOnly, deleteItem); // DELETE /api/items/:id - Xóa item

export default router;