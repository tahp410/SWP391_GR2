import Voucher from "../models/voucherModel.js";

// @desc    Create new voucher
// @route   POST /api/vouchers
// @access  Admin
export const createVoucher = async (req, res) => {
  try {
    const voucher = new Voucher(req.body);
    await voucher.save();
    res.status(201).json(voucher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all vouchers
// @route   GET /api/vouchers
// @access  Public (ai cũng xem được)
export const getVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find();
    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single voucher by ID
// @route   GET /api/vouchers/:id
// @access  Public
export const getVoucherById = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }
    res.json(voucher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update voucher
// @route   PUT /api/vouchers/:id
// @access  Admin
export const updateVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }
    res.json(voucher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete voucher
// @route   DELETE /api/vouchers/:id
// @access  Admin
export const deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndDelete(req.params.id);
    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }
    res.json({ message: "Voucher deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
