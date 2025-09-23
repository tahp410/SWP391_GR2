import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/userModel.js";

dotenv.config(); // đọc biến môi trường từ file .env
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // cho phép gọi API từ domain khác (React)
app.use(express.json()); // parse body JSON

// Route test
app.get("/", (req, res) => {
  res.send("🚀 Backend server is running!");
});

// Lắng nghe cổng
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

