import mongoose from "mongoose";
import QRCode from "qrcode";
import Showtime from "../models/showtimeModel.js";
import Seat from "../models/seatModel.js";
import Theater from "../models/theaterModel.js";
import SeatLayout from "../models/seatLayoutModel.js";
import SeatStatus from "../models/seatStatusModel.js";
import Booking from "../models/bookingModel.js";
import Voucher from "../models/voucherModel.js";
import { payOS, generateOrderCode } from "../utils/payosClient.js";

const HOLD_MINUTES = 1;

export const getSeatsForShowtime = async (req, res) => {
  try {
    const { id: showtimeId } = req.params;
    const showtime = await Showtime.findById(showtimeId).populate("theater branch");
    if (!showtime) return res.status(404).json({ message: "Showtime not found" });

    // Do not allow booking after showtime start
    const now = new Date();
    const hasStarted = now >= new Date(showtime.startTime);

    // Get all seats of theater (auto-provision from SeatLayout if missing)
    let seats = await Seat.find({ theater: showtime.theater, isActive: true });
    if (!seats.length) {
      const theater = await Theater.findById(showtime.theater).lean();
      if (theater?.seatLayout) {
        const layout = await SeatLayout.findById(theater.seatLayout).lean();
        if (layout) {
          const rowLabels = layout.rowLabels?.length ? layout.rowLabels : Array.from({ length: layout.rows }, (_, i) => String.fromCharCode(65 + i));
          const vipRowsSet = new Set(layout.vipRows || []);
          const disabledSet = new Set((layout.disabledSeats || []).map((d) => `${d.row}-${d.number}`));
          const coupleRanges = layout.coupleSeats || [];
          const branchId = showtime.branch;
          const docs = [];
          for (let r = 0; r < layout.rows; r++) {
            const rowLabel = rowLabels[r] || String.fromCharCode(65 + r);
            for (let n = 1; n <= layout.seatsPerRow; n++) {
              if (disabledSet.has(`${rowLabel}-${n}`)) continue;
              // Determine type by vip rows or couple ranges
              let type = vipRowsSet.has(rowLabel) ? 'vip' : 'standard';
              for (const range of coupleRanges) {
                if (range.row === rowLabel && n >= (range.startSeat || 0) && n <= (range.endSeat || 0)) {
                  type = 'couple';
                  break;
                }
              }
              docs.push({
                theater: showtime.theater,
                branch: branchId,
                row: rowLabel,
                number: n,
                type,
                isActive: true,
                position: { x: n, y: r + 1 },
              });
            }
          }
          if (docs.length) {
            await Seat.insertMany(docs);
            seats = await Seat.find({ theater: showtime.theater, isActive: true });
          }
        }
      }
    }

    // Get statuses for this showtime
    const seatStatuses = await SeatStatus.find({ showtime: showtimeId }).lean();
    const seatIdToStatus = new Map(seatStatuses.map((s) => [String(s.seat), s]));

    // Build response merging default price by seat type
    const result = seats.map((seat) => {
      const statusDoc = seatIdToStatus.get(String(seat._id));
      let status = statusDoc?.status || "available";
      // Expired holds should be treated as available
      if (
        statusDoc?.reservationExpires && new Date(statusDoc.reservationExpires) < new Date()
      ) {
        status = "available";
      }
      const type = seat.type || "standard";
      const price = showtime.price?.[type] ?? showtime.price?.standard;
      return {
        seatId: seat._id,
        row: seat.row,
        number: seat.number,
        type,
        position: seat.position,
        status,
        reservedBy: statusDoc?.reservedBy || null,
        expiresAt: statusDoc?.reservationExpires || null,
        price,
      };
    });

    res.json({
      showtimeId,
      theater: showtime.theater,
      hasStarted,
      seats: result,
    });
  } catch (err) {
    console.error("getSeatsForShowtime error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const holdSeats = async (req, res) => {
  try {
    const { id: showtimeId } = req.params;
    const { seatIds } = req.body; // array of seat ObjectId strings
    const userId = req.user?._id || null;

    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ message: "seatIds is required" });
    }

    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) return res.status(404).json({ message: "Showtime not found" });

    const now = new Date();
    if (now >= new Date(showtime.startTime) || now >= new Date(showtime.endTime) || showtime.status !== 'active') {
      return res.status(400).json({ message: "Showtime unavailable for booking" });
    }

    const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

    // Atomically upsert each seat status if available
    const results = [];
    for (const seatId of seatIds) {
      // Fetch existing status
      const existing = await SeatStatus.findOne({ showtime: showtimeId, seat: seatId });

      // If already booked -> fail fast
      if (existing && existing.status === "booked") {
        results.push({ seatId, success: false, reason: "booked" });
        continue;
      }

      // If reserved but not expired -> cannot take
      if (
        existing &&
        (existing.status === "reserved" || existing.status === "selecting") &&
        existing.reservationExpires &&
        new Date(existing.reservationExpires) > new Date()
      ) {
        results.push({ seatId, success: false, reason: "held" });
        continue;
      }

      // Reserve
      const typeSeat = await Seat.findById(seatId).lean();
      const seatType = typeSeat?.type || "standard";
      const price = showtime.price?.[seatType] ?? showtime.price?.standard ?? 0;

      const updated = await SeatStatus.findOneAndUpdate(
        { showtime: showtimeId, seat: seatId },
        {
          $set: {
            status: "reserved",
            reservedBy: userId,
            reservedAt: new Date(),
            reservationExpires: expiresAt,
            price,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      results.push({ seatId, success: true, expiresAt: updated.reservationExpires });
    }

    const allOk = results.every((r) => r.success);
    const failed = results.filter((r) => !r.success);
    res.status(allOk ? 200 : 207).json({ results, failed });
  } catch (err) {
    console.error("holdSeats error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const releaseSeats = async (req, res) => {
  try {
    const { id: showtimeId } = req.params;
    const { seatIds } = req.body;
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ message: "seatIds is required" });
    }
    await SeatStatus.updateMany(
      { showtime: showtimeId, seat: { $in: seatIds }, status: { $in: ["reserved", "selecting"] } },
      { $set: { status: "available" }, $unset: { reservedBy: 1, reservedAt: 1, reservationExpires: 1 } }
    );
    res.json({ released: seatIds.length });
  } catch (err) {
    console.error("releaseSeats error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const { showtimeId, seats, combos = [], voucher = null, customerInfo } = req.body;
    const userId = req.user?._id || null;

    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) return res.status(404).json({ message: "Showtime not found" });

    const now = new Date();
    if (now >= new Date(showtime.startTime) || now >= new Date(showtime.endTime) || showtime.status !== 'active') {
      return res.status(400).json({ message: "Showtime unavailable for booking" });
    }

    const seatIds = seats.map((s) => s.seatId);

    // Verify seats are reserved (held) and not expired
    const statuses = await SeatStatus.find({ showtime: showtimeId, seat: { $in: seatIds } });
    if (statuses.length !== seatIds.length) {
      return res.status(400).json({ message: "Some seats are not held" });
    }
    for (const st of statuses) {
      if (
        st.status !== "reserved" ||
        !st.reservationExpires ||
        new Date(st.reservationExpires) < new Date()
      ) {
        return res.status(400).json({ message: "Hold expired or invalid" });
      }
    }

    // Calculate totals from SeatStatus prices and combos
    const seatDetails = [];
    let total = 0;
    for (const st of statuses) {
      const seatDoc = await Seat.findById(st.seat).lean();
      const type = seatDoc?.type || "standard";
      seatDetails.push({ row: seatDoc.row, number: seatDoc.number, type, price: st.price });
      total += st.price;
    }

    // Simple combos total if provided with price in body
    let combosNormalized = [];
    if (Array.isArray(combos)) {
      combosNormalized = combos.map((c) => ({ combo: c.combo, quantity: c.quantity || 1, price: c.price || 0 }));
      for (const c of combosNormalized) {
        total += (c.price || 0) * (c.quantity || 1);
      }
    }

    // Apply voucher if provided as code
    let discountAmount = 0;
    let voucherDoc = null;
    if (voucher) {
      const orConds = [{ code: String(voucher) }];
      if (mongoose.Types.ObjectId.isValid(String(voucher))) {
        orConds.unshift({ _id: voucher });
      }
      voucherDoc = await Voucher.findOne({ $or: orConds });
      if (voucherDoc) {
        const withinDate = now >= new Date(voucherDoc.startDate) && now <= new Date(voucherDoc.endDate);
        const active = voucherDoc.isActive !== false;
        const movieOk = !voucherDoc.applicableMovies?.length || voucherDoc.applicableMovies.some((m) => String(m) === String(showtime.movie));
        const branchOk = !voucherDoc.applicableBranches?.length || voucherDoc.applicableBranches.some((b) => String(b) === String(showtime.branch));
        if (withinDate && active && movieOk && branchOk && total >= (voucherDoc.minPurchase || 0)) {
          if (voucherDoc.discountType === 'percentage') {
            discountAmount = Math.floor((total * voucherDoc.discountValue) / 100);
          } else if (voucherDoc.discountType === 'fixed') {
            discountAmount = Math.floor(voucherDoc.discountValue);
          }
          if (voucherDoc.maxDiscount && voucherDoc.maxDiscount > 0) {
            discountAmount = Math.min(discountAmount, voucherDoc.maxDiscount);
          }
        }
      }
    }

    // Generate QR code data with bank account information
    const qrData = JSON.stringify({
      type: "bank_transfer",
      accountName: "CINEMA BOOKING SYSTEM",
      accountNumber: "19036780036015",
      bankCode: "TCB",
      bankName: "Techcombank",
      amount: total - discountAmount,
      bookingId: null, // Will be set after booking creation
      timestamp: new Date().toISOString(),
      content: `Payment for booking`
    });
    
    // Generate QR code as data URL
    let qrCodeDataUrl = null;
    try {
      qrCodeDataUrl = await QRCode.toDataURL(qrData);
    } catch (qrErr) {
      console.error("QR code generation error:", qrErr);
    }

    const bookingDoc = await Booking.create({
      user: userId,
      showtime: showtimeId,
      seats: seatDetails,
      totalAmount: total - discountAmount,
      combos: combosNormalized,
      voucher: voucherDoc?._id || null,
      discountAmount,
      paymentStatus: null, // Not paid yet
      bookingStatus: "pending",
      qrCode: qrCodeDataUrl,
      customerInfo: customerInfo || undefined,
    });
    
    // Update QR code with booking ID
    const updatedQrData = JSON.stringify({
      type: "bank_transfer",
      accountName: "CINEMA BOOKING SYSTEM",
      accountNumber: "19036780036015",
      bankCode: "TCB",
      bankName: "Techcombank",
      amount: total - discountAmount,
      bookingId: bookingDoc._id.toString(),
      transactionId: `TXN-${Date.now()}`,
      timestamp: new Date().toISOString(),
      content: `Payment for booking ${bookingDoc._id.toString().substring(0, 8)}`
    });
    
    try {
      bookingDoc.qrCode = await QRCode.toDataURL(updatedQrData);
      await bookingDoc.save();
    } catch (qrErr) {
      console.error("QR code update error:", qrErr);
    }

    // Mark seats as booked atomically (only if currently reserved)
    const upd = await SeatStatus.updateMany(
      { showtime: showtimeId, seat: { $in: seatIds }, status: "reserved" },
      { $set: { status: "booked", booking: bookingDoc._id }, $unset: { reservedBy: 1, reservedAt: 1, reservationExpires: 1 } }
    );

    if (!upd.modifiedCount || upd.modifiedCount !== seatIds.length) {
      // Rollback created booking if seats couldn't be booked (race condition)
      await Booking.deleteOne({ _id: bookingDoc._id });
      return res.status(409).json({ message: "Seats no longer available" });
    }

    res.status(201).json({ booking: bookingDoc });
  } catch (err) {
    console.error("createBooking error:", err);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
};

export const releaseExpiredHolds = async () => {
  const now = new Date();
  await SeatStatus.updateMany(
    {
      status: { $in: ["reserved", "selecting"] },
      reservationExpires: { $lte: now },
    },
    { $set: { status: "available" }, $unset: { reservedBy: 1, reservedAt: 1, reservationExpires: 1 } }
  );
};

// Get booking by ID for purchase page
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || null;
    
    const booking = await Booking.findById(id)
      .populate("user", "name email")
      .populate("showtime")
      .populate({
        path: "showtime",
        populate: [
          { path: "movie", select: "title poster duration" },
          { path: "theater", select: "name" },
          { path: "branch", select: "name address" }
        ]
      })
      .populate("voucher", "code discountType discountValue")
      .populate("combos.combo", "name");
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Check if user owns this booking (unless admin)
    if (userId && String(booking.user?._id || booking.user) !== String(userId) && req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    res.json({ booking });
  } catch (err) {
    console.error("getBookingById error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Generate PayOS checkout link and QR (no bank info)
export const generatePaymentQR = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user?._id || null;
    
    if (!bookingId) {
      return res.status(400).json({ message: "bookingId is required" });
    }
    
    const booking = await Booking.findById(bookingId).populate('showtime');
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Check ownership
    if (userId && String(booking.user || booking.user?._id) !== String(userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    if (booking.paymentStatus === "completed") {
      return res.status(400).json({ message: "Payment already completed" });
    }

    // Create PayOS payment link
    const orderCode = generateOrderCode();
    const description = `Booking ${String(booking._id).slice(-6)}`.slice(0, 25);
    const result = await payOS.paymentRequests.create({
      orderCode,
      amount: Math.max(0, Math.floor(booking.totalAmount)),
      description,
      returnUrl: `${process.env.CLIENT_BASE_URL || "http://localhost:3000"}/payment/return`,
      cancelUrl: `${process.env.CLIENT_BASE_URL || "http://localhost:3000"}/payment/cancel`,
    });

    // Generate scannable QR from checkoutUrl
    const paymentUrl = result?.checkoutUrl || null;
    let paymentQRCode = null;
    if (paymentUrl) {
      try {
        paymentQRCode = await QRCode.toDataURL(paymentUrl);
      } catch (qrErr) {
        console.error("generatePaymentQR: cannot generate QR:", qrErr);
      }
    }

    // Mark booking as pending and store transaction/order code
    booking.transactionId = String(orderCode);
    booking.paymentMethod = "bank_transfer";
    booking.paymentStatus = "pending";
    booking.bookingStatus = "pending";
    await booking.save();

    return res.json({
      success: true,
      message: "Payment link generated",
      paymentUrl,
      paymentQRCode,
      orderCode,
    });
  } catch (err) {
    console.error("generatePaymentQR error:", err);
    // Bubble up PayOS errors if available
    const message = err?.response?.data?.desc || err?.response?.data?.message || err?.message || "Failed to generate payment link";
    res.status(500).json({ message });
  }
};

// Mark payment as purchased (user confirms they've paid)
export const markAsPurchased = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user?._id || null;
    
    if (!bookingId) {
      return res.status(400).json({ message: "bookingId is required" });
    }
    
    const booking = await Booking.findById(bookingId).populate('showtime');
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Check ownership
    if (userId && String(booking.user || booking.user?._id) !== String(userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    if (booking.paymentStatus === "completed") {
      return res.status(400).json({ message: "Payment already completed" });
    }
    
    // Lock seats for 24 hours while waiting for admin confirmation
    const showtimeId = booking.showtime?._id || booking.showtime;
    if (!showtimeId) {
      return res.status(400).json({ message: "Showtime not found" });
    }
    
    // Get seat IDs from booking - find seats by row and number
    const showtimeDoc = await Showtime.findById(showtimeId).populate('theater');
    const theaterId = showtimeDoc?.theater?._id || showtimeDoc?.theater;
    
    if (!theaterId) {
      return res.status(400).json({ message: "Theater not found" });
    }
    
    // Find seats by matching row and number
    const seatDocs = await Seat.find({
      theater: theaterId,
      $or: booking.seats.map(s => ({ row: s.row, number: s.number }))
    });
    
    if (seatDocs.length !== booking.seats.length) {
      return res.status(400).json({ message: "Some seats not found" });
    }
    
    const seatIds = seatDocs.map(s => s._id);
    const lockExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    // Lock seats by setting status to "blocked" for 24 hours
    await SeatStatus.updateMany(
      { 
        showtime: showtimeId, 
        seat: { $in: seatIds }
      },
      { 
        $set: { 
          status: "blocked",
          reservationExpires: lockExpiresAt,
          reservedBy: userId,
          reservedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    // Set status to pending - waiting for admin confirmation
    booking.paymentStatus = "pending";
    booking.bookingStatus = "pending";
    booking.transactionId = booking.transactionId || `TXN-${Date.now()}`;
    await booking.save();
    
    return res.json({
      success: true,
      message: "Payment marked as purchased. Seats locked for 24 hours. Waiting for admin confirmation.",
      booking: booking,
      lockExpiresAt: lockExpiresAt
    });
  } catch (err) {
    console.error("markAsPurchased error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Cancel payment - release seats and reset statuses
export const cancelPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user?._id || null;
    
    if (!bookingId) {
      return res.status(400).json({ message: "bookingId is required" });
    }
    
    const booking = await Booking.findById(bookingId).populate('showtime');
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Check ownership
    if (userId && String(booking.user || booking.user?._id) !== String(userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    if (booking.paymentStatus === "completed") {
      return res.status(400).json({ message: "Cannot cancel completed payment" });
    }
    
    // Release seats - make them available again
    const showtimeId = booking.showtime?._id || booking.showtime;
    if (showtimeId) {
      const showtimeDoc = await Showtime.findById(showtimeId).populate('theater');
      const theaterId = showtimeDoc?.theater?._id || showtimeDoc?.theater;
      
      if (theaterId) {
        const seatDocs = await Seat.find({
          theater: theaterId,
          $or: booking.seats.map(s => ({ row: s.row, number: s.number }))
        });
        
        const seatIds = seatDocs.map(s => s._id);
        
        // Release seats by setting status to "available"
        await SeatStatus.updateMany(
          { 
            showtime: showtimeId, 
            seat: { $in: seatIds }
          },
          { 
            $set: { status: "available" },
            $unset: { 
              reservedBy: 1, 
              reservedAt: 1, 
              reservationExpires: 1,
              booking: 1
            }
          }
        );
      }
    }
    
    // Reset booking statuses to previous state
    booking.paymentStatus = null; // Reset to not paid
    booking.bookingStatus = "confirmed"; // Keep booking confirmed but payment not paid
    booking.transactionId = null;
    await booking.save();
    
    return res.json({
      success: true,
      message: "Payment cancelled. Seats released.",
      booking: booking
    });
  } catch (err) {
    console.error("cancelPayment error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Admin confirms or rejects payment
export const confirmPayment = async (req, res) => {
  try {
    const { bookingId, action } = req.body; // action: 'approve' or 'reject'
    
    if (!bookingId || !action) {
      return res.status(400).json({ message: "bookingId and action (approve/reject) are required" });
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: "action must be 'approve' or 'reject'" });
    }
    
    const booking = await Booking.findById(bookingId).populate('showtime');
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    if (booking.paymentStatus !== "pending") {
      return res.status(400).json({ message: "Only pending payments can be confirmed" });
    }
    
    const showtimeId = booking.showtime?._id || booking.showtime;
    
    if (action === 'approve') {
      // Approve: Mark payment as completed, keep seats booked
      booking.paymentStatus = "completed";
      booking.bookingStatus = "confirmed";
      
      // Generate ticket QR code for check-in
      const ticketQRData = JSON.stringify({
        type: "ticket",
        bookingId: booking._id.toString(),
        showtimeId: showtimeId.toString(),
        seats: booking.seats.map(s => `${s.row}${s.number}`),
        timestamp: new Date().toISOString(),
      });
      
      try {
        booking.ticketQRCode = await QRCode.toDataURL(ticketQRData);
        console.log("Ticket QR code generated successfully for booking:", booking._id.toString());
      } catch (qrErr) {
        console.error("Ticket QR code generation error:", qrErr);
      }
      
      // Ensure seats remain booked
      if (showtimeId) {
        const showtimeDoc = await Showtime.findById(showtimeId).populate('theater');
        const theaterId = showtimeDoc?.theater?._id || showtimeDoc?.theater;
        
        if (theaterId) {
          const seatDocs = await Seat.find({
            theater: theaterId,
            $or: booking.seats.map(s => ({ row: s.row, number: s.number }))
          });
          
          const seatIds = seatDocs.map(s => s._id);
          
          // Keep seats booked
          await SeatStatus.updateMany(
            { 
              showtime: showtimeId, 
              seat: { $in: seatIds }
            },
            { 
              $set: { 
                status: "booked",
                booking: booking._id
              },
              $unset: { 
                reservedBy: 1, 
                reservedAt: 1, 
                reservationExpires: 1
              }
            }
          );
        }
      }
    } else {
      // Reject: Mark payment as failed, release seats
      booking.paymentStatus = "failed";
      booking.bookingStatus = "cancelled";
      
      // Release seats
      if (showtimeId) {
        const showtimeDoc = await Showtime.findById(showtimeId).populate('theater');
        const theaterId = showtimeDoc?.theater?._id || showtimeDoc?.theater;
        
        if (theaterId) {
          const seatDocs = await Seat.find({
            theater: theaterId,
            $or: booking.seats.map(s => ({ row: s.row, number: s.number }))
          });
          
          const seatIds = seatDocs.map(s => s._id);
          
          // Release seats by setting status to "available"
          await SeatStatus.updateMany(
            { 
              showtime: showtimeId, 
              seat: { $in: seatIds }
            },
            { 
              $set: { status: "available" },
              $unset: { 
                reservedBy: 1, 
                reservedAt: 1, 
                reservationExpires: 1,
                booking: 1
              }
            }
          );
        }
      }
    }
    
    await booking.save();
    
    // Populate booking trước khi return để có đầy đủ thông tin
    await booking.populate([
      { path: 'showtime', populate: ['movie', 'theater', 'branch'] },
      { path: 'user', select: 'name email phone' }
    ]);
    
    return res.json({
      success: true,
      message: action === 'approve' ? "Payment approved successfully" : "Payment rejected. Seats released.",
      booking: booking
    });
  } catch (err) {
    console.error("confirmPayment error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get user's purchase history
export const getUserPurchaseHistory = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const bookings = await Booking.find({ user: userId })
      .populate("showtime")
      .populate({
        path: "showtime",
        populate: [
          { path: "movie", select: "title poster duration" },
          { path: "theater", select: "name" },
          { path: "branch", select: "name address" }
        ]
      })
      .populate("voucher", "code discountType discountValue")
      .populate("combos.combo", "name")
      .sort({ createdAt: -1 });
    
    res.json({ bookings });
  } catch (err) {
    console.error("getUserPurchaseHistory error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get all purchase history (admin only)
export const getAllPurchaseHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, paymentStatus } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const filter = {};
    if (status) filter.bookingStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    
    const bookings = await Booking.find(filter)
      .populate("user", "name email phone")
      .populate("showtime")
      .populate({
        path: "showtime",
        populate: [
          { path: "movie", select: "title poster duration" },
          { path: "theater", select: "name" },
          { path: "branch", select: "name address" }
        ]
      })
      .populate("voucher", "code discountType discountValue")
      .populate("combos.combo", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Booking.countDocuments(filter);
    
    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("getAllPurchaseHistory error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get booking by QR code (for employee to preview before check-in)
export const getBookingByQR = async (req, res) => {
  try {
    const { qrCodeData } = req.body;
    
    if (!qrCodeData) {
      return res.status(400).json({ message: "QR code data is required" });
    }
    
    // Parse QR code data - hỗ trợ cả JSON và Booking ID trực tiếp
    let bookingId = qrCodeData.trim();
    
    // Thử parse JSON nếu có vẻ như JSON string
    if (qrCodeData.trim().startsWith('{') || qrCodeData.trim().startsWith('[')) {
      try {
        const ticketData = JSON.parse(qrCodeData);
        bookingId = ticketData.bookingId || bookingId;
      } catch (parseErr) {
        // Nếu parse lỗi nhưng có vẻ là JSON, vẫn dùng bookingId trực tiếp
        console.log("Failed to parse QR data as JSON, using as booking ID");
      }
    }
    
    // Nếu bookingId là ObjectId format (24 hex characters), dùng trực tiếp
    // Nếu không, thử tìm booking bằng partial ID
    if (!bookingId) {
      return res.status(400).json({ message: "Invalid QR code format or Booking ID" });
    }
    
    let booking;
    
    // Thử tìm bằng full ObjectId (24 ký tự hex)
    if (bookingId.length === 24 && /^[0-9a-fA-F]{24}$/.test(bookingId)) {
      // Validate ObjectId và tìm bằng exact match
      if (mongoose.Types.ObjectId.isValid(bookingId)) {
        booking = await Booking.findById(bookingId);
      } else {
        return res.status(400).json({ 
          message: `Booking ID không hợp lệ. Vui lòng nhập đúng định dạng ObjectId (24 ký tự hex).` 
        });
      }
    } else if (bookingId.length < 24 && /^[0-9a-fA-F]+$/.test(bookingId)) {
      // Nếu là partial ID (8 ký tự đầu), thử tìm bằng cách khác
      // Tìm tất cả booking có ID bắt đầu bằng prefix này
      const allBookings = await Booking.find({}).select('_id').limit(1000);
      const matchingId = allBookings.find(b => 
        b._id.toString().startsWith(bookingId.toLowerCase())
      );
      
      if (matchingId) {
        booking = await Booking.findById(matchingId._id);
      }
    } else {
      return res.status(400).json({ 
        message: `Booking ID không hợp lệ. Vui lòng nhập Booking ID (8 hoặc 24 ký tự hex). Bạn đã nhập: ${bookingId}` 
      });
    }
    
    if (!booking) {
      return res.status(404).json({ message: `Không tìm thấy booking với ID: ${bookingId}` });
    }
    
    // Populate booking data
    await booking.populate([
      { 
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title poster duration' },
          { path: 'theater', select: 'name' },
          { path: 'branch', select: 'name address' }
        ]
      },
      { path: 'user', select: 'name email phone' }
    ]);
    
    return res.json({
      success: true,
      booking: booking
    });
  } catch (err) {
    console.error("getBookingByQR error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Employee check-in ticket by scanning QR code
export const checkInTicket = async (req, res) => {
  try {
    const { qrCodeData } = req.body; // QR code data từ scanner
    const employeeId = req.user?._id;
    
    if (!qrCodeData) {
      return res.status(400).json({ message: "QR code data is required" });
    }
    
    if (!employeeId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Parse QR code data - hỗ trợ cả JSON và Booking ID trực tiếp
    let bookingId = qrCodeData.trim();
    
    // Thử parse JSON nếu có vẻ như JSON string
    if (qrCodeData.trim().startsWith('{') || qrCodeData.trim().startsWith('[')) {
      try {
        const ticketData = JSON.parse(qrCodeData);
        bookingId = ticketData.bookingId || bookingId;
      } catch (parseErr) {
        console.log("Failed to parse QR data as JSON, using as booking ID");
      }
    }
    
    if (!bookingId) {
      return res.status(400).json({ message: "Invalid QR code format or Booking ID" });
    }
    
    // Tìm booking
    let booking;
    
    // Thử tìm bằng full ObjectId (24 ký tự hex)
    if (bookingId.length === 24 && /^[0-9a-fA-F]{24}$/.test(bookingId)) {
      // Validate ObjectId và tìm bằng exact match
      if (mongoose.Types.ObjectId.isValid(bookingId)) {
        booking = await Booking.findById(bookingId);
      } else {
        return res.status(400).json({ 
          message: `Booking ID không hợp lệ. Vui lòng nhập đúng định dạng ObjectId (24 ký tự hex).` 
        });
      }
    } else if (bookingId.length < 24 && /^[0-9a-fA-F]+$/.test(bookingId)) {
      // Nếu là partial ID (8 ký tự đầu), thử tìm bằng cách khác
      // Tìm tất cả booking có ID bắt đầu bằng prefix này
      const allBookings = await Booking.find({}).select('_id').limit(1000);
      const matchingId = allBookings.find(b => 
        b._id.toString().startsWith(bookingId.toLowerCase())
      );
      
      if (matchingId) {
        booking = await Booking.findById(matchingId._id);
      }
    } else {
      return res.status(400).json({ 
        message: `Booking ID không hợp lệ. Vui lòng nhập Booking ID (8 hoặc 24 ký tự hex). Bạn đã nhập: ${bookingId}` 
      });
    }
    
    if (!booking) {
      return res.status(404).json({ message: `Không tìm thấy booking với ID: ${bookingId}` });
    }
    
    // Populate booking data
    await booking.populate([
      { 
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title poster duration' },
          { path: 'theater', select: 'name' },
          { path: 'branch', select: 'name address' }
        ]
      }
    ]);
    
    // Kiểm tra payment status
    if (booking.paymentStatus !== 'completed') {
      return res.status(400).json({ 
        message: "Cannot check in. Payment not completed.",
        booking: booking
      });
    }
    
    // Kiểm tra đã check-in chưa
    if (booking.checkedIn) {
      return res.status(400).json({ 
        message: "Ticket already checked in",
        booking: booking,
        checkedInAt: booking.checkedInAt
      });
    }
    
    // Kiểm tra showtime đã bắt đầu chưa (có thể cho phép check-in trước 30 phút)
    const showtime = booking.showtime;
    const now = new Date();
    const showtimeStart = new Date(showtime.startTime);
    const checkInWindow = new Date(showtimeStart.getTime() - 30 * 60 * 1000); // 30 phút trước khi bắt đầu
    
    if (now < checkInWindow) {
      return res.status(400).json({ 
        message: `Check-in available from ${checkInWindow.toLocaleString('vi-VN')}`,
        booking: booking
      });
    }
    
    // Kiểm tra showtime đã kết thúc chưa
    if (now > new Date(showtime.endTime)) {
      return res.status(400).json({ 
        message: "Showtime has already ended",
        booking: booking
      });
    }
    
    // Thực hiện check-in
    booking.checkedIn = true;
    booking.checkedInAt = new Date();
    booking.employeeId = employeeId;
    await booking.save();
    
    return res.json({
      success: true,
      message: "Check-in successful",
      booking: booking
    });
  } catch (err) {
    console.error("checkInTicket error:", err);
    res.status(500).json({ message: err.message });
  }
};


