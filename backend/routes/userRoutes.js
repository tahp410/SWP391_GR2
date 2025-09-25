import express from "express";
import protect from "../middleware/authMiddleware.js";
import { loginUser, changePassword } from "../controllers/userController.js";
import { getUserProfile, updateUserProfile } from "../controllers/profileController.js";
const router = express.Router();

// Auth routes
router.post("/login", loginUser);
router.post("/change-password", protect, changePassword);
router.get("/profile",protect,getUserProfile)
router.put("/profile",protect,updateUserProfile)


export default router;


