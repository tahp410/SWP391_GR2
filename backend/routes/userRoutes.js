import express from "express";
import protect, { adminOnly, adminOrEmployee } from "../middleware/authMiddleware.js";
import { loginUser, changePassword, registerUser, updateUser, getAllUsers, deleteUser } from "../controllers/userController.js";
import { getUserProfile, updateUserProfile } from "../controllers/profileController.js";
const router = express.Router();

// Auth routes
router.post("/login", loginUser);
router.post("/change-password", protect, changePassword);
router.post("/register", registerUser);

// Admin routes - yêu cầu quyền admin
router.get("/", protect, adminOrEmployee, getAllUsers); // Lấy danh sách tất cả users
router.put("/:id", protect, adminOrEmployee, updateUser); // Cập nhật user
router.delete("/:id", protect, adminOnly, deleteUser); // Xóa user

// Profile routes
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

export default router;


