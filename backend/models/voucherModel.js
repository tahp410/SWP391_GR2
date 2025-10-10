import mongoose from "mongoose";

const voucherSchema = mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    discountType: {
      type: String,
      enum: ["Percentage", "Fixed"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    // If minPurchase is 0, there is no minimum purchase required to use the voucher.
    minPurchase: {
      type: Number,
      default: 0,
    // If maxDiscount is 0, it means there is no maximum discount limit.
    maxDiscount: {
      type: Number,
      default: 0,
    },
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    applicableMovies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
      },
    ],
    applicableBranches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Voucher = mongoose.model("Voucher", voucherSchema);

export default Voucher;
