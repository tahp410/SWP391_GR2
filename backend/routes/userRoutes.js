import express from "express";
import protect, { adminOnly, adminOrEmployee } from "../middleware/authMiddleware.js";
import {
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  getAllUsers,
  addUser,
  updateUser,
  deleteUser,
  registerUser
} from "../controllers/userController.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Forgot & Reset password (Quên và Đặt lại mật khẩu)
router.post("/forgot-password", forgotPassword); 
router.post("/reset-password/:token", resetPassword);

// Protected routes (Yêu cầu đăng nhập)
router.post("/change-password", protect, changePassword);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// Admin routes (Yêu cầu quyền admin)
router.get("/", protect, adminOnly, getAllUsers);
router.post("/", protect, adminOnly, addUser);
router.put("/:id", protect, adminOnly, updateUser);
router.delete("/:id", protect, adminOnly, deleteUser);

export default router;