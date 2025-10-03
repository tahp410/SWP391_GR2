import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Eye,
  X,
  Calendar,
  Film,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import "../style/movieManagement.css";

const MovieManagement = () => {
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    genre: "",
    releaseDate: "",
    endDate: "",
    language: "",
    director: "",
    cast: "",
    poster: "",
    trailer: "",
    status: "coming-soon",
    hotness: "",
    rating: "",
    timestamps: { createdAt: "", updatedAt: "" },
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // API base URL 
  const API_BASE_URL = "http://localhost:5000/api";

  // Lấy token từ localStorage
  const getToken = () => {
    return localStorage.getItem("token");
  };

  // Show message
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  // Fetch all movie
  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/movies`);
      if (response.ok) {
        const data = await response.json();
        setMovies(data);
      } else {
        showMessage("error", "Lỗi khi tải danh sách phim");
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      showMessage("error", "Lỗi khi tải danh sách phim");
    } finally {
      setLoading(false);
    }
  }, []);

  // Search movie
  const searchMovies = useCallback(
    async (term) => {
      if (!term.trim()) {
        fetchMovies();
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/movies/search?q=${encodeURIComponent(term)}`
        );
        if (response.ok) {
          const data = await response.json();
          setMovies(data);
        } else {
          showMessage("error", "Lỗi khi tìm kiếm phim");
        }
      } catch (error) {
        console.error("Error searching branches:", error);
        showMessage("error", "Lỗi khi tìm kiếm phim");
      }
    },
    [fetchMovies]
  );

  // Create movie
  const createMovie = async (data) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/movies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const newBranch = await response.json();
        setMovies((prev) => [...prev, newBranch]);
        showMessage("success", "Thêm phim thành công");
      } else {
        const error = await response.json();
        showMessage("error", error.message || "Lỗi khi thêm phim");
      }
    } catch (error) {
      console.error("Error creating movie:", error);
      showMessage("error", "Lỗi khi thêm phim");
    }
  };

  // Update movie
  const updateMovie = async (id, data) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/movies/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedMovie = await response.json();
        setMovies((prev) => prev.map((b) => (b._id === id ? updatedMovie : b)));
        showMessage("success", "Cập nhật phim thành công");
      } else {
        const error = await response.json();
        showMessage("error", error.message || "Lỗi khi cập nhật phim");
      }
    } catch (error) {
      console.error("Error updating movie:", error);
      showMessage("error", "Lỗi khi cập nhật phim");
    }
  };

  // Delete movie
  const deleteMovie = async (id) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/movies/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMovies((prev) => prev.filter((b) => b._id !== id));
        showMessage("success", "Xóa phim thành công");
      } else {
        const error = await response.json();
        showMessage("error", error.message || "Lỗi khi xóa phim");
      }
    } catch (error) {
      console.error("Error deleting movie:", error);
      showMessage("error", "Lỗi khi xóa phim");
    }
  };

  // Load movie on component mount
  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // Search functionality
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchMovies(searchTerm);
      } else {
        fetchMovies();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchMovies, searchMovies]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    // Giới hạn hotness và rating không quá 10
    if (name === "hotness" || name === "rating") {
      newValue = Math.min(Number(value), 10);
    }
    if (name.includes(".")) {
      const [parent, child, grandchild] = name.split(".");
      if (grandchild) {
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [grandchild]: value,
            },
          },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [parent]: { ...prev[parent], [child]: value },
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: newValue }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // genre và cast = array
    const genreArray = formData.genre
      ? Array.isArray(formData.genre)
        ? formData.genre
        : formData.genre
            .split(",")
            .map((g) => g.trim())
            .filter((g) => g)
      : [];
    const castArray = formData.cast
      ? Array.isArray(formData.cast)
        ? formData.cast
        : formData.cast
            .split(",")
            .map((c) => c.trim())
            .filter((c) => c)
      : [];

    // status = string
    let statusValue = formData.status;
    if (
      !statusValue ||
      (statusValue !== "coming-soon" && statusValue !== "now-showing")
    ) {
      statusValue = "coming-soon";
    }

    // timestamps phải là object có createdAt, updatedAt (ISO string)
    let timestamps = formData.timestamps || {};
    const now = new Date().toISOString();
    if (!timestamps.createdAt) timestamps.createdAt = now;
    if (!timestamps.updatedAt) timestamps.updatedAt = now;

    function safeDate(val) {
      const d = new Date(val);
      return isNaN(d.getTime()) ? now : d.toISOString();
    }
    const submitData = {
      title: formData.title?.trim() || "",
      description: formData.description?.trim() || "",
      duration: Number(formData.duration) || 0,
      genre: genreArray,
      releaseDate: safeDate(formData.releaseDate),
      endDate: safeDate(formData.endDate),
      language: formData.language?.trim() || "",
      director: formData.director?.trim() || "",
      cast: castArray,
      poster: formData.poster?.trim() || "",
      trailer: formData.trailer?.trim() || "",
      status: statusValue,
      hotness: Math.min(Number(formData.hotness) || 0, 10),
      rating: Math.min(Number(formData.rating) || 0, 10),
      timestamps,
    };

    if (selectedMovie) {
      await updateMovie(selectedMovie._id, submitData);
    } else {
      await createMovie(submitData);
    }

    closeModal();
  };

  const handleEdit = (movie) => {
    setSelectedMovie(movie);
    // Format date to YYYY-MM-DD for input type='date'
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().slice(0, 10);
    };
    setFormData({
      ...movie,
      releaseDate: formatDate(movie.releaseDate),
      endDate: formatDate(movie.endDate),
      genre: Array.isArray(movie.genre)
        ? movie.genre.join(", ")
        : movie.genre || "",
      cast: Array.isArray(movie.cast)
        ? movie.cast.join(", ")
        : movie.cast || "",
    });
    setShowModal(true);
  };

  const handleDeleteConfirm = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bộ phim này?")) {
      await deleteMovie(id);
    }
  };

  const handleViewDetail = (movie) => {
    setSelectedMovie(movie);
    setShowDetailModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMovie(null);
    setFormData({
      title: "",
      description: "",
      duration: "",
      genre: "",
      releaseDate: "",
      endDate: "",
      language: "",
      director: "",
      cast: "",
      poster: "",
      trailer: "",
      status: "coming-soon",
      hotness: "",
      rating: "",
      timestamps: { createdAt: "", updatedAt: "" },
    });
  };

  const filteredMovies = movies.filter((movie) => {
    const title = movie.title || "";
    let genreStr = "";
    if (Array.isArray(movie.genre)) {
      genreStr = movie.genre.join(", ");
    } else if (typeof movie.genre === "string") {
      genreStr = movie.genre;
    } else {
      genreStr = "";
    }
    return (
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      genreStr.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handlePosterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, poster: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AdminLayout title="Quản Lý Phim">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Quản Lý Phim
          </h1>
          <p className="text-gray-600">Quản lý thông tin các bộ phim</p>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : message.type === "error"
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Search and Add */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-3 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc thành phố..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
            >
              <Plus size={20} />
              Thêm Phim Mới
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-gray-500">
            Đang tải danh sách phim...
          </div>
        )}

        {/* Branch List */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMovies.map((movie) => (
              <div
                key={movie._id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <img
                  src={
                    movie.poster ||
                    "data:image/jpeg;base64,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"
                  }
                  alt={movie.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        {movie.title}
                      </h3>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                          movie.status
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {movie.status === "now-showing"
                         
                          ? "now-showing"
                          : "coming-soon"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-start gap-2">
                      <Film size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{movie.director}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>{movie.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>{movie.releaseDate}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {movie.genre.slice(0, 3).map((genre, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs"
                      >
                        {genre}
                      </span>
                    ))}
                    {movie.genre.length > 3 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        +{movie.genre.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetail(movie)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Eye size={16} />
                      Chi tiết
                    </button>
                    <button
                      onClick={() => handleEdit(movie)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteConfirm(movie._id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredMovies.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Không tìm thấy bộ phim nào.
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">
                  {selectedMovie ? "Cập Nhật Phim" : "Thêm Phim Mới"}
                </h2>
                <button onClick={closeModal} className="modal-close">
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-group">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tiêu đề
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Đạo diễn
                      </label>
                      <input
                        type="text"
                        name="director"
                        value={formData.director}
                        onChange={handleInputChange}
                        placeholder="Nhập tên đạo diễn"
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hotness
                      </label>
                      <input
                        type="number"
                        name="hotness"
                        value={formData.hotness}
                        onChange={handleInputChange}
                        placeholder="Độ hot (ví dụ: 10)"
                        className="form-input"
                        min={0}
                        max={10}
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rating
                      </label>
                      <input
                        type="number"
                        name="rating"
                        value={formData.rating}
                        onChange={handleInputChange}
                        placeholder="Điểm đánh giá (ví dụ: 8.5)"
                        className="form-input"
                        min={0}
                        max={10}
                        step="0.1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Ngày ra mắt *</label>
                      <input
                        type="date"
                        name="releaseDate"
                        value={formData.releaseDate}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">
                        Ngày kết thúc khởi chiếu *
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Thời gian *</label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="block text-sm font-medium text-gray-700 mb-1">
                    <div>
                      <label className="form-label">Ngôn ngữ *</label>
                      <input
                        type="text"
                        name="language"
                        value={formData.language}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div>
                    <div>
                      <label className="form-label">Poster</label>
                      <input
                        type="file"
                        accept=".png,.jpeg,.jpg,.svg,image/png,image/jpeg,image/svg+xml"
                        onChange={handlePosterChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div>
                    <div>
                      <label className="form-label">Trailer</label>
                      <input
                        type="url"
                        name="trailer"
                        value={formData.trailer}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thể loại (ngăn cách bởi dấu phẩy)
                    </label>
                    <input
                      type="text"
                      name="genre"
                      value={formData.genre}
                      onChange={handleInputChange}
                      placeholder="Action, Comedy, Drama"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Diễn viên (ngăn cách bởi dấu phẩy)
                    </label>
                    <input
                      type="text"
                      name="cast"
                      value={formData.cast}
                      onChange={handleInputChange}
                      placeholder="Duy Anh, Đăng Phát"
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái phim
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    >
                      <option value="coming-soon">Coming Soon</option>
                      <option value="now-showing">Now Showing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Nhập mô tả phim"
                      className="form-input"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="btn btn-secondary flex-1"
                    >
                      Hủy
                    </button>
                    <button type="submit" className="btn btn-primary flex-1">
                      {selectedMovie ? "Cập Nhật" : "Thêm Mới"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedMovie && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">Chi Tiết Phim</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="modal-close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <img
                  src={
                    selectedMovie.poster ||
                    "data:image/jpeg;base64,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"
                  }
                  alt={selectedMovie.name}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {selectedMovie.title}
                    </h3>
                    <span
                      className={`inline-block px-3 py-1 text-sm rounded-full ${
                        selectedMovie.status
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {selectedMovie.status === "now-showing"
                          ? "now-showing"
                          : "coming-soon"}
                    </span>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Mô tả</h4>
                    <div className="text-gray-700 whitespace-pre-line">
                      {selectedMovie.description}
                    </div>
                  </div>

                  <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">
                        Thời lượng
                      </h4>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={18} />
                        <span>{selectedMovie.duration} phút</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">
                        Ngôn ngữ
                      </h4>
                      <div className="text-gray-700">
                        {selectedMovie.language}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">
                        Ngày khởi chiếu
                      </h4>
                      <div className="text-gray-700">
                        {selectedMovie.releaseDate}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">
                        Ngày kết thúc
                      </h4>
                      <div className="text-gray-700">
                        {selectedMovie.endDate}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Thể loại
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMovie.genre &&
                        selectedMovie.genre.map((genre, idx) => (
                          <span
                            key={idx}
                            className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                          >
                            {genre}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Đạo diễn
                    </h4>
                    <div className="text-gray-700">
                      {selectedMovie.director}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Diễn viên
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMovie.cast &&
                        selectedMovie.cast.map((actor, idx) => (
                          <span
                            key={idx}
                            className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm"
                          >
                            {actor}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">
                        Trailer
                      </h4>
                      {selectedMovie.trailer ? (
                        <a
                          href={selectedMovie.trailer}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          Xem trailer
                        </a>
                      ) : (
                        <span className="text-gray-500">Không có trailer</span>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Hot</h4>
                      <span
                        className={`inline-block px-3 py-1 text-sm rounded-full ${
                          selectedMovie.hotness > 0
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {selectedMovie.hotness > 0 ? selectedMovie.hotness : "Không"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">
                        Đánh giá
                      </h4>
                      <span className="text-gray-700">
                        {selectedMovie.rating || "Chưa có"}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">
                        Ngày tạo
                      </h4>
                      <span className="text-gray-700">
                        {selectedMovie.createdAt
                          ? new Date(selectedMovie.createdAt).toLocaleString()
                          : "-"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">
                        Ngày cập nhật
                      </h4>
                      <span className="text-gray-700">
                        {selectedMovie.updatedAt
                          ? new Date(selectedMovie.updatedAt).toLocaleString()
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default MovieManagement;
