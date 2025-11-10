import { payOS } from "../utils/payosClient.js";

// Note: PayOS SDK exposes webhooks.verify which throws on invalid signature/checksum
export async function verifyPayOSWebhook(req, res, next) {
	try {
		// If body is already parsed JSON, pass directly
		const data = await payOS.webhooks.verify(req.body);
		// Attach verified data for downstream handler
		req.payOS = { webhook: data };
		next();
	} catch (err) {
		return res.status(400).json({ message: "Invalid PayOS webhook", error: err?.message || "invalid_webhook" });
	}
}


