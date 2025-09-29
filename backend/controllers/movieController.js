import Movie from "../models/movieModel.js";

export const getAllMovies = async (req, res) => {
  try {
    const movies = await Movie.find();
    // Chuẩn hóa dữ liệu trả về
    const formattedMovies = movies.map((movie) => ({
      _id: movie._id,
      title: movie.title || "",
      description: movie.description || "",
      duration: movie.duration || 0,
      genre: Array.isArray(movie.genre) ? movie.genre : [],
      releaseDate: movie.releaseDate || null,
      endDate: movie.endDate || null,
      language: movie.language || "",
      director: movie.director || "",
      cast: Array.isArray(movie.cast) ? movie.cast : [],
      poster: movie.poster || "",
      trailer: movie.trailer || "",
      status: movie.status || "coming-soon",
      hotness: typeof movie.hotness === "number" ? movie.hotness : 0,
      rating: typeof movie.rating === "number" ? movie.rating : 0,
      createdAt: movie.createdAt,
      updatedAt: movie.updatedAt,
    }));
    res.json(formattedMovies);
  } catch (error) {
    console.error("Get all movies error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

export const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: "Không tìm thấy phim" });
    }
    res.json(movie);
  } catch (error) {
    console.error("Get movie by ID error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

export const createMovie = async (req, res) => {
  try {
    const {
      title,
      description,
      duration,
      genre,
      releaseDate,
      endDate,
      language,
      director,
      cast,
      poster,
      trailer,
      status,
      hotness,
      rating,
    } = req.body;
    if (
      !title ||
      !description ||
      !duration ||
      !genre ||
      !releaseDate ||
      !endDate ||
      !language ||
      !director ||
      !cast ||
      !poster ||
      !status ||
      !hotness ||
      !rating
    ) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }
    const branchData = {
      title: title.trim(),
      description: description.trim(),
      duration,
      genre: Array.isArray(genre)
        ? genre
        : genre
            .split(",")
            .map((g) => g.trim())
            .filter((g) => g),
      releaseDate: new Date(releaseDate),
      endDate: new Date(endDate),
      language: language.trim(),
      director: director.trim(),
      cast: Array.isArray(cast)
        ? cast
        : cast
            .split(",")
            .map((c) => c.trim())
            .filter((c) => c),
      poster: poster.trim(),
      trailer: trailer ? trailer.trim() : "",
      status: status !== undefined ? status : "coming-soon",
      hotness,
      rating,
    };

    const newMovie = new Movie(branchData);
    await newMovie.save();
    res.status(201).json(newMovie);
  } catch (error) {
    console.error("Create movie error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
export const updateMovie = async (req, res) => {
  try {
    try {
      const {
        title,
        description,
        duration,
        genre,
        releaseDate,
        endDate,
        language,
        director,
        cast,
        poster,
        trailer,
        status,
        hotness,
        rating,
      } = req.body;
      if (
        !title ||
        !description ||
        !duration ||
        !genre ||
        !releaseDate ||
        !endDate ||
        !language ||
        !director ||
        !cast ||
        !poster ||
        !status ||
        !hotness ||
        !rating
      ) {
        return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
      }
      const updateData = {
        title: title.trim(),
        description: description.trim(),
        duration,
        genre: Array.isArray(genre)
          ? genre
          : genre
              .split(",")
              .map((g) => g.trim())
              .filter((g) => g),
        releaseDate: new Date(releaseDate),
        endDate: new Date(endDate),
        language: language.trim(),
        director: director.trim(),
        cast: Array.isArray(cast)
          ? cast
          : cast
              .split(",")
              .map((c) => c.trim())
              .filter((c) => c),
        poster: poster.trim(),
        trailer: trailer ? trailer.trim() : "",
        status: status !== undefined ? status : "coming-soon",
        hotness,
        rating,
      };
      const movie = await Movie.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      });
      if (!movie) {
        return res.status(404).json({ message: "Không tìm thấy phim" });
      }
      res.json(movie);
    } catch (error) {
      console.error("Update movie error:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  } catch (error) {
    console.error("Update movie error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
export const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: "Không tìm thấy phim" });
    }
    res.json({ message: "Xóa phim thành công" });
  } catch (error) {
    console.error("Delete movie error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

export const searchMovie = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res.json([]);
    }
    const searchTerm = q.trim();
    const movies = await Movie.find({
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { genre: { $regex: searchTerm, $options: "i" } },
        { director: { $regex: searchTerm, $options: "i" } },
        { cast: { $regex: searchTerm, $options: "i" } },
      ],
    });
    res.json(movies);
  } catch (error) {
    console.error("Search movies error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
