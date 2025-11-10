import Booking from "../models/bookingModel.js";
import { payOS, generateOrderCode } from "../utils/payosClient.js";
import QRCode from "qrcode";
import Showtime from "../models/showtimeModel.js";
import Seat from "../models/seatModel.js";
import SeatStatus from "../models/seatStatusModel.js";

export const createPayment = async (req, res) => {
	try {
		const { bookingId, returnUrl, cancelUrl } = req.body;
		if (!bookingId) {
			return res.status(400).json({ message: "bookingId is required" });
		}

		const booking = await Booking.findById(bookingId);
		if (!booking) {
			return res.status(404).json({ message: "Booking not found" });
		}

		// If already paid, no need to create link again
		if (booking.paymentStatus === "completed") {
			return res.status(400).json({ message: "Booking already paid" });
		}

		const amount = Math.max(0, Math.floor(booking.totalAmount)); // integer amount
		const orderCode = generateOrderCode();

		const description = `Thanh toán đặt vé ${String(booking._id).slice(-8)}`;
		const payload = {
			orderCode,
			amount,
			description,
			returnUrl: returnUrl || `${process.env.CLIENT_BASE_URL || "http://localhost:3000"}/payment/return`,
			cancelUrl: cancelUrl || `${process.env.CLIENT_BASE_URL || "http://localhost:3000"}/payment/cancel`,
		};

		const result = await payOS.paymentRequests.create(payload);
		booking.transactionId = String(orderCode);
		booking.paymentMethod = "bank_transfer";
		await booking.save();

		return res.status(201).json({
			success: true,
			paymentUrl: result?.checkoutUrl,
			orderCode,
		});
	} catch (err) {
		console.error("createPayment error:", err);
		return res.status(500).json({ message: err?.message || "Failed to create payment" });
	}
};

export const payOSWebhook = async (req, res) => {
	try {
		// Verified webhook data attached by middleware (WebhookData type)
		const data = req.payOS?.webhook;
		if (!data) {
			return res.status(400).json({ message: "Missing webhook data" });
		}

		const orderCode = data?.orderCode?.toString?.() || "";
		if (!orderCode) {
			return res.status(400).json({ message: "Missing orderCode" });
		}

		// Find booking by orderCode stored in transactionId
		const booking = await Booking.findOne({ transactionId: orderCode }).populate("showtime");
		if (!booking) {
			// Acknowledge to avoid retries, but log
			console.error("Webhook: booking not found for orderCode", orderCode);
			return res.status(200).json({ ok: true });
		}

		// If already completed, idempotent
		if (booking.paymentStatus === "completed") {
			return res.status(200).json({ ok: true });
		}

		// Check if payment was successful (webhook.verify only returns data for valid webhooks)
		// The code field in WebhookData indicates status: "00" means success
		const isSuccess = data?.code === "00";
		if (!isSuccess) {
			// Mark failed if explicit failure
			booking.paymentStatus = "failed";
			await booking.save();
			return res.status(200).json({ ok: true });
		}

		// Success path: mark as paid and confirmed, generate ticket QR,
		// ensure seats remain booked (reuse logic from admin approval flow)
		booking.paymentStatus = "completed";
		booking.bookingStatus = "confirmed";

		const showtimeId = booking.showtime?._id || booking.showtime;
		if (showtimeId) {
			try {
				// Generate ticket QR code (used for check-in)
				const ticketQRData = JSON.stringify({
					type: "ticket",
					bookingId: booking._id.toString(),
					showtimeId: showtimeId.toString(),
					seats: booking.seats.map((s) => `${s.row}${s.number}`),
					timestamp: new Date().toISOString(),
				});
				booking.ticketQRCode = await QRCode.toDataURL(ticketQRData);
			} catch (qrErr) {
				console.error("Ticket QR code generation error:", qrErr);
			}

			try {
				const showtimeDoc = await Showtime.findById(showtimeId).populate("theater");
				const theaterId = showtimeDoc?.theater?._id || showtimeDoc?.theater;
				if (theaterId) {
					const seatDocs = await Seat.find({
						theater: theaterId,
						$or: booking.seats.map((s) => ({ row: s.row, number: s.number })),
					});
					const seatIds = seatDocs.map((s) => s._id);
					await SeatStatus.updateMany(
						{ showtime: showtimeId, seat: { $in: seatIds } },
						{
							$set: { status: "booked", booking: booking._id },
							$unset: { reservedBy: 1, reservedAt: 1, reservationExpires: 1 },
						}
					);
				}
			} catch (err) {
				console.error("Seat status update error:", err);
			}
		}

		await booking.save();
		return res.status(200).json({ ok: true });
	} catch (err) {
		console.error("payOSWebhook error:", err);
		return res.status(200).json({ ok: true });
	}
};

