import express from "express";
import protect, { adminOnly } from "../middleware/authMiddleware.js";
import {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  searchMovie
} from "../controllers/movieController.js";

const router = express.Router();

// Public routes - ai cũng có thể xem danh sách và tìm kiếm chi nhánh
router.get("/", getAllMovies);

router.get("/hot", async (req, res) => {
  try {
    const movies = await Movie.find({ hotness: { $gt: 5 } });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy phim hot" });
  }
});

router.get("/now-showing", async (req, res) => {
  try {
    const movies = await Movie.find({ status: "now-showing" });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy phim đang chiếu" });
  }
});

router.get("/search", searchMovie);
router.get("/:id", getMovieById);

// Admin only routes - chỉ admin mới được tạo, sửa, xóa chi nhánh
router.post("/", protect, adminOnly, createMovie);
router.put("/:id", protect, adminOnly, updateMovie);
router.delete("/:id", protect, adminOnly, deleteMovie);

export default router;
