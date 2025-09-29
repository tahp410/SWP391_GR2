import express from "express";
import protect, { adminOnly } from "../middleware/authMiddleware.js";
import {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  searchBranches
} from "../controllers/branchController.js";

const router = express.Router();

// Public routes - ai cũng có thể xem danh sách và tìm kiếm chi nhánh
router.get("/", getAllBranches);
router.get("/search", searchBranches);
router.get("/:id", getBranchById);

// Admin only routes - chỉ admin mới được tạo, sửa, xóa chi nhánh
router.post("/", protect, adminOnly, createBranch);
router.put("/:id", protect, adminOnly, updateBranch);
router.delete("/:id", protect, adminOnly, deleteBranch);

export default router;
