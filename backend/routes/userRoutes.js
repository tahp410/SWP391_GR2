import express from "express";
import protect from "../middleware/authMiddleware.js";
import { loginUser, changePassword } from "../controllers/userController.js";

const router = express.Router();

// Auth routes
router.post("/login", loginUser);
router.post("/change-password", protect, changePassword);


export default router;


