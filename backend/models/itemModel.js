// models/itemModel.js
import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["popcorn", "drink", "snack"],
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
  },
  image_url: {
    type: String,
    trim: true,
    default: "",
  },
}, {
  timestamps: true, // Thêm createdAt và updatedAt
});

const Item = mongoose.model("Item", itemSchema);

export default Item;
