import express from "express";
import { createPayment, payOSWebhook } from "../controllers/paymentController.js";
import { verifyPayOSWebhook } from "../middleware/payosWebhookMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// User initiates a payment for a booking
router.post("/create", protect, createPayment);

// Webhook endpoint - PayOS calls this
router.post("/webhook", verifyPayOSWebhook, payOSWebhook);

export default router;


