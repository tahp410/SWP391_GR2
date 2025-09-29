import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/userController.js";

const router = express.Router();

// Auth routes (Đăng nhập & Đổi mật khẩu)
router.post("/login", loginUser);

// Đường dẫn này yêu cầu người dùng phải đăng nhập (có token hợp lệ)
router.post("/change-password", protect, changePassword);

// Forgot & Reset password (Quên và Đặt lại mật khẩu)
router.post("/forgot-password", forgotPassword); 
router.post("/reset-password/:token", resetPassword);

export default router;