import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/userModel.js";
import userRoutes from './routes/userRoutes.js';
import branchRoutes from './routes/branchRoutes.js';

dotenv.config(); // đọc biến môi trường từ file .env
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // cho phép gọi API từ domain khác (React)
app.use(express.json()); // parse body JSON

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  if (req.headers.authorization) {
    console.log('Authorization header:', req.headers.authorization.substring(0, 20) + '...');
  } else {
    console.log('No authorization header');
  }
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);

// Route test
app.get("/", (req, res) => {
  res.send("🚀 Backend server is running!");
});

// Lắng nghe cổng
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

