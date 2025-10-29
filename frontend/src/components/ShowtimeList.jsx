import React, { useEffect, useState } from "react";
import Header from "./Header";
import "../style/showtimes.css";

const ShowtimeList = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🏢 Lấy danh sách chi nhánh
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

  // 🎬 Lấy lịch chiếu (lọc theo chi nhánh + ngày)
  useEffect(() => {
    const fetchShowtimes = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/showtimes/public");
        let data = await res.json();

        // 1️⃣ Ẩn suất chiếu đã qua
        const now = new Date();
        data = data.filter((item) => new Date(item.startTime) > now);

        // 2️⃣ Lọc theo chi nhánh
        if (selectedBranch) {
          data = data.filter((item) => item.branch?._id === selectedBranch);
        }

        // 3️⃣ Lọc theo ngày chiếu (cho phép nhập mm/dd/yyyy hoặc yyyy-mm-dd)
        if (selectedDate) {
          let chosenDate;
          if (selectedDate.includes("/")) {
            // mm/dd/yyyy → yyyy-mm-dd
            const [month, day, year] = selectedDate.split("/");
            chosenDate = new Date(`${year}-${month}-${day}`);
          } else {
            chosenDate = new Date(selectedDate);
          }

          const chosenDateString = chosenDate.toISOString().split("T")[0];

          data = data.filter((item) => {
            const showDate = new Date(item.startTime)
              .toISOString()
              .split("T")[0];
            return showDate === chosenDateString;
          });
        }

        // Sắp xếp theo thời gian gần nhất
        data.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        setShowtimes(data);
      } catch (err) {
        console.error("Error fetching showtimes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShowtimes();
  }, [selectedBranch, selectedDate]);

  if (loading) {
    return (
      <div className="cgv-container showtime-loading">
        <Header />
        <div className="loading-text">Đang tải lịch chiếu...</div>
      </div>
    );
  }

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
            <input
              type="text"
              placeholder="mm/dd/yyyy hoặc yyyy-mm-dd"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        {/* 🧾 Danh sách suất chiếu */}
        {showtimes.length === 0 ? (
          <div className="empty-text">Không có suất chiếu phù hợp!</div>
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

                  <button className="book-btn">Đặt vé ngay</button>
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
