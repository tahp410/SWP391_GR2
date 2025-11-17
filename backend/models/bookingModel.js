import mongoose from "mongoose";

const bookingSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function() { return !this.employeeId; },
    },
    showtime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Showtime",
      required: true,
    },
    seats: [
      {
        row: String,
        number: Number,
        type: {
          type: String,
          enum: ["standard", "vip", "couple"],
          default: "standard",
        },
        price: Number,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    combos: [
      {
        combo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Combo",
        },
        quantity: {
          type: Number,
          default: 1,
        },
        price: Number,
      },
    ],
    voucher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voucher",
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["momo", "zalopay", "credit_card", "bank_transfer", "cash", "qr"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "done"],
      default: "pending",
    },
    qrCode: {
      type: String,
    },
    ticketQRCode: {
      type: String,  // QR code cho vé check-in (khác với payment QR)
    },
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
    },
    transactionId: {
      type: String,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    customerInfo: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
