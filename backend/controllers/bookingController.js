import mongoose from "mongoose";
import Showtime from "../models/showtimeModel.js";
import Seat from "../models/seatModel.js";
import Theater from "../models/theaterModel.js";
import SeatLayout from "../models/seatLayoutModel.js";
import SeatStatus from "../models/seatStatusModel.js";
import Booking from "../models/bookingModel.js";
import Voucher from "../models/voucherModel.js";

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

    const bookingDoc = await Booking.create({
      user: userId,
      showtime: showtimeId,
      seats: seatDetails,
      totalAmount: total - discountAmount,
      combos: combosNormalized,
      voucher: voucherDoc?._id || null,
      discountAmount,
      paymentStatus: "pending",
      bookingStatus: "confirmed",
      customerInfo: customerInfo || undefined,
    });

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


