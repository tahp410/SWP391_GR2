import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import "../style/showtimes.css";

const ShowtimeList = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🏦 Lấy danh sách chi nhánh
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/branches");
        const data = await res.json();
        setBranches(data);
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };
    fetchBranches();
  }, []);

  // 🎬 Lấy danh sách suất chiếu
  useEffect(() => {
    const fetchShowtimes = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/showtimes/public");
        let data = await res.json();

        const now = new Date();
        data = data.filter((item) => new Date(item.startTime) > now);

        if (selectedBranch) {
          data = data.filter((item) => item.branch?._id === selectedBranch);
        }

        // 🗓️ Lọc theo ngày chiếu
        if (searchDate) {
          let chosenDate;
          if (searchDate.includes("/")) {
            const [day, month, year] = searchDate.split("/");
            chosenDate = new Date(`${year}-${month}-${day}`);
          } else {
            chosenDate = new Date(searchDate);
          }

          // ✅ So sánh phần ngày / tháng / năm để tránh lệch múi giờ
          data = data.filter((item) => {
            const show = new Date(item.startTime);
            return (
              show.getDate() === chosenDate.getDate() &&
              show.getMonth() === chosenDate.getMonth() &&
              show.getFullYear() === chosenDate.getFullYear()
            );
          });
        }

        // ⏰ Sắp xếp theo thời gian chiếu
        data.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        setShowtimes(data);
      } catch (err) {
        console.error("Error fetching showtimes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShowtimes();
  }, [selectedBranch, searchDate]);

  // 📅 Nhấn Enter để tìm
  const handleDateKeyPress = (e) => {
    if (e.key === "Enter") setSearchDate(selectedDate);
  };

  // 🔍 Nút tìm kiếm
  const handleSearchClick = () => setSearchDate(selectedDate);

  // 📆 Nút chọn lịch
  const handleCalendarChange = (e) => {
    const value = e.target.value;
    if (value) {
      const [year, month, day] = value.split("-");
      const formattedDate = `${day}/${month}/${year}`;
      setSelectedDate(formattedDate);
      setSearchDate(formattedDate);
    }
  };

  // 🕐 Hiển thị khi đang tải
  if (loading) {
    return (
      <div className="cgv-container showtime-loading">
        <Header />
        <div className="loading-text">Đang tải lịch chiếu...</div>
      </div>
    );
  }

  // 🧾 Hiển thị danh sách
  return (
    <div className="cgv-container">
      <Header />
      <main className="showtime-content">
        <div className="section-header">
          <div className="section-icon showing-icon">🎬</div>
          <div>
            <h2>Lịch Chiếu Phim</h2>
            <p>Chọn chi nhánh và ngày để xem lịch chiếu phù hợp</p>
          </div>
        </div>

        {/* 🎯 Bộ lọc */}
        <div className="filter-container">
          <div className="filter-item">
            <label>Chi nhánh:</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="">Tất cả</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Ngày chiếu:</label>
            <div className="search-wrapper">
              <button
                type="button"
                className="calendar-btn"
                onClick={() => document.getElementById("hidden-calendar").showPicker()}
              >
                📅
              </button>

              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                onKeyDown={handleDateKeyPress}
              />

              <input
                type="date"
                id="hidden-calendar"
                className="hidden-calendar"
                onChange={handleCalendarChange}
              />

              <button className="search-btn" onClick={handleSearchClick}>
                🔍
              </button>
            </div>
          </div>
        </div>

        {/* 🧾 Danh sách suất chiếu */}
        {showtimes.length === 0 ? (
          <div className="empty-text">
            Hình như không có suất chiếu nào phù hợp rồi 😢
          </div>
        ) : (
          <div className="showtime-grid">
            {showtimes.map((item) => (
              <div key={item._id} className="showtime-card">
                <div className="showtime-poster">
                  <img
                    src={
                      item.movie?.poster ||
                      "https://via.placeholder.com/400x600?text=No+Poster"
                    }
                    alt={item.movie?.title}
                  />
                </div>
                <div className="showtime-info">
                  <h3>{item.movie?.title}</h3>
                  <p className="movie-genre">
                    {Array.isArray(item.movie?.genre)
                      ? item.movie.genre.join(", ")
                      : item.movie?.genre}
                  </p>
                  <p>
                    <strong>Rạp:</strong> {item.theater?.name || "—"}
                  </p>
                  <p>
                    <strong>Chi nhánh:</strong> {item.branch?.name || "—"}
                  </p>
                  <p>
                    <strong>Giờ chiếu:</strong>{" "}
                    {new Date(item.startTime).toLocaleString("vi-VN")}
                  </p>
                  <p>
                    <strong>Giá vé:</strong>{" "}
                    {item.price?.standard
                      ? `${item.price.standard.toLocaleString("vi-VN")}₫`
                      : "—"}
                  </p>

                  <button
                    className="book-btn"
                    onClick={() => {
                      const movieId = item.movie?._id || item.movie?.id;
                      const branchId = item.branch?._id;
                      const start = item.startTime ? new Date(item.startTime) : null;
                      const yyyyMmDd = start ? `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(start.getDate()).padStart(2,'0')}` : '';
                      if (movieId) {
                        const qp = [];
                        if (branchId) qp.push(`branchId=${branchId}`);
                        if (yyyyMmDd) qp.push(`date=${yyyyMmDd}`);
                        const qs = qp.length ? `?${qp.join('&')}` : '';
                        navigate(`/booking/${movieId}${qs}`);
                      }
                    }}
                  >
                    Đặt vé ngay
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ShowtimeList;
