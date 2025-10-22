import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

import User from "./models/userModel.js";
import userRoutes from './routes/userRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import voucherRoutes from './routes/voucherRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import registerRoutes from './routes/register.js';
import itemRoutes from "./routes/itemRoutes.js";
import comboRoutes from "./routes/comboRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import theaterRoutes from "./routes/theaterRoutes.js";
import showtimeRoutes from "./routes/showtimeRoutes.js";

// ES modules equivalent của __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); // đọc biến môi trường từ file .env
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // cho phép gọi API từ domain khác (React)
app.use(express.json({ limit: '50mb' })); // parse body JSON với limit lớn
app.use(express.urlencoded({ limit: '50mb', extended: true })); // parse form data

// Serve static files cho uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/vouchers', voucherRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api', registerRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/combos", comboRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/theaters", theaterRoutes);
app.use("/api/showtimes", showtimeRoutes);
// Route test
app.get("/", (req, res) => {
  res.send("🚀 Backend server is running!");
});

// Lắng nghe cổng
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
